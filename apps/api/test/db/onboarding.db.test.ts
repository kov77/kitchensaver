import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { describe, expect, onTestFinished, test, vi } from 'vitest'

import { PeopleService } from '../../src/people/people.service.js'
import { PrismaService } from '../../src/prisma/prisma.service.js'
import { birthDateForAge } from '../support/dates.js'
import { createConsentedActor } from '../support/factories.js'
import { createPeopleClient } from '../support/people-client.js'
import { createTestApp } from '../support/test-app.js'
import { createActor } from '../support/test-auth.js'

const bodyParameters = {
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'ACTIVE',
  formulaSex: 'MALE',
} as const

const noAllergies = { status: 'NONE', warningAcknowledged: true } as const

const fullRequest = {
  name: 'Anna',
  dateOfBirth: birthDateForAge(30),
  bodyParameters,
  goal: { mode: 'ESTIMATED', goalType: 'MAINTAIN', dailyKcal: 2600 },
  allergies: {
    status: 'HAS_ALLERGIES',
    items: [
      { allergenCode: 'PEANUT' },
      { allergenCode: 'OTHER', customLabel: 'Kiwi' },
    ],
  },
  exclusions: [{ ingredientName: 'Cilantro' }],
  preferences: [{ ingredientName: 'Broccoli', rating: 2 }],
}

async function setup() {
  const app = await createTestApp()
  const prisma = app.get(PrismaService)
  const user = await createConsentedActor(prisma)
  const otherUser = await createConsentedActor(prisma)
  const server = app.getHttpServer()
  return {
    app,
    server,
    prisma,
    user,
    asUser: createPeopleClient(server, user),
    asOtherUser: createPeopleClient(server, otherUser),
    countProfiles: (accountId: string) =>
      prisma.personProfile.count({ where: { accountId } }),
    countKeys: (accountId: string) =>
      prisma.onboardingRequest.count({ where: { accountId } }),
  }
}

describe('POST /people/onboarding', () => {
  test('creates a bare profile with empty restrictions', async () => {
    const { asUser, user, countProfiles } = await setup()

    const response = await asUser.onboard(
      {
        name: 'Anna',
        dateOfBirth: birthDateForAge(30),
        allergies: noAllergies,
      },
      randomUUID(),
    )

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      person: {
        name: 'Anna',
        planReadiness: { ready: false, reasons: ['MISSING_GOAL'] },
      },
      goal: null,
      bodyParameters: null,
      allergies: [],
      exclusions: [],
      preferences: [],
    })
    expect(await countProfiles(user.accountId)).toBe(1)
  })

  test('creates the profile, goal, body parameters and restrictions together', async () => {
    const { asUser } = await setup()

    const response = await asUser.onboard(fullRequest, randomUUID())

    expect(response.status).toBe(201)
    expect(response.body.person).toMatchObject({
      name: 'Anna',
      planReadiness: { ready: true, reasons: [] },
    })
    expect(response.body.bodyParameters).toMatchObject(bodyParameters)
    expect(response.body.goal).toMatchObject({
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2600,
      calculationMethod: 'DRI_2023_ADULT',
    })
    expect(response.body.allergies).toMatchObject([
      { allergenCode: 'PEANUT', resolved: true },
      { allergenCode: 'OTHER', customLabel: 'Kiwi', resolved: false },
    ])
    expect(response.body.exclusions).toMatchObject([
      { ingredientName: 'Cilantro' },
    ])
    expect(response.body.preferences).toMatchObject([
      { ingredientName: 'Broccoli', rating: 2 },
    ])
  })

  test('calculates the same estimate as the stateless preview', async () => {
    const { asUser } = await setup()
    const preview = await asUser.previewGoal({
      ...bodyParameters,
      dateOfBirth: fullRequest.dateOfBirth,
      goalType: 'MAINTAIN',
    })

    const response = await asUser.onboard(fullRequest, randomUUID())

    expect(preview.status).toBe(200)
    expect(response.body.goal.estimatedMaintenanceKcal).toBe(
      preview.body.estimatedMaintenanceKcal,
    )
  })

  test('saves a manual goal that needs no body parameters', async () => {
    const { asUser } = await setup()

    const response = await asUser.onboard(
      {
        name: 'Anna',
        dateOfBirth: birthDateForAge(30),
        allergies: noAllergies,
        goal: { mode: 'MANUAL', dailyKcal: 2100 },
      },
      randomUUID(),
    )

    expect(response.status).toBe(201)
    expect(response.body.goal).toMatchObject({
      mode: 'MANUAL',
      goalType: 'CUSTOM',
      dailyKcal: 2100,
    })
    expect(response.body.bodyParameters).toBeNull()
  })

  test('onboards an 18-year-old with the growth equations', async () => {
    const { asUser } = await setup()

    const response = await asUser.onboard(
      {
        name: 'Ben',
        dateOfBirth: birthDateForAge(18),
        allergies: noAllergies,
        bodyParameters: { ...bodyParameters, heightCm: 165, weightKg: 56 },
        goal: { mode: 'ESTIMATED', goalType: 'MAINTAIN', dailyKcal: 2400 },
      },
      randomUUID(),
    )

    expect(response.status).toBe(201)
    expect(response.body.goal.calculationMethod).toBe('DRI_2023_AGES_3_18')
  })

  test('answers 401 without a token', async () => {
    const { server } = await setup()

    const response = await request(server)
      .post('/api/v1/people/onboarding')
      .set('Idempotency-Key', randomUUID())
      .send({ name: 'Anna', dateOfBirth: birthDateForAge(30) })

    expect(response.status).toBe(401)
  })
})

describe('consent', () => {
  test.each([
    ['/api/v1/people/onboarding', fullRequest],
    [
      '/api/v1/people/goals/estimate',
      {
        ...bodyParameters,
        dateOfBirth: birthDateForAge(30),
        goalType: 'MAINTAIN',
      },
    ],
  ])(
    '%s answers 403 CONSENT_REQUIRED before consents are recorded',
    async (path, body) => {
      const { server } = await setup()
      const newcomer = await createActor()

      const response = await request(server)
        .post(path)
        .set('Authorization', newcomer.authorization)
        .set('Idempotency-Key', randomUUID())
        .send(body)

      expect(response.status).toBe(403)
      expect(response.body.code).toBe('CONSENT_REQUIRED')
    },
  )
})

describe('Idempotency-Key', () => {
  test('a repeat returns the same profile and creates nothing', async () => {
    const { asUser, user, countProfiles, countKeys } = await setup()
    const key = randomUUID()
    const first = await asUser.onboard(fullRequest, key)

    const repeat = await asUser.onboard(fullRequest, key)

    expect(repeat.status).toBe(201)
    expect(repeat.body.person.id).toBe(first.body.person.id)
    expect(repeat.body).toEqual(first.body)
    expect(await countProfiles(user.accountId)).toBe(1)
    expect(await countKeys(user.accountId)).toBe(1)
  })

  test('the order of properties in the body does not matter', async () => {
    const { asUser, countProfiles, user } = await setup()
    const key = randomUUID()
    const first = await asUser.onboard(fullRequest, key)
    const { name, dateOfBirth, ...rest } = fullRequest
    const reordered = { ...rest, dateOfBirth, name }

    const repeat = await asUser.onboard(reordered, key)

    expect(repeat.status).toBe(201)
    expect(repeat.body.person.id).toBe(first.body.person.id)
    expect(await countProfiles(user.accountId)).toBe(1)
  })

  test('a repeat still succeeds when the profile limit is full', async () => {
    const { asUser } = await setup()
    const key = randomUUID()
    const first = await asUser.onboard(fullRequest, key)
    await asUser.create({ name: 'Ben', dateOfBirth: birthDateForAge(40) })
    const limit = await asUser.onboard(fullRequest, randomUUID())

    const repeat = await asUser.onboard(fullRequest, key)

    expect(limit.status).toBe(409)
    expect(limit.body.code).toBe('PROFILE_LIMIT_REACHED')
    expect(repeat.status).toBe(201)
    expect(repeat.body.person.id).toBe(first.body.person.id)
  })

  test('a repeat returns an archived profile as archived', async () => {
    const { asUser, countProfiles, user } = await setup()
    const key = randomUUID()
    const first = await asUser.onboard(fullRequest, key)
    await asUser.archive(first.body.person.id)

    const repeat = await asUser.onboard(fullRequest, key)

    expect(repeat.status).toBe(201)
    expect(repeat.body.person.id).toBe(first.body.person.id)
    expect(repeat.body.person.archivedAt).not.toBeNull()
    expect(await countProfiles(user.accountId)).toBe(1)
  })

  test('a repeat shows the profile as it is now', async () => {
    const { asUser } = await setup()
    const key = randomUUID()
    const first = await asUser.onboard(fullRequest, key)
    await asUser.patch(first.body.person.id, { name: 'Annie' })

    const repeat = await asUser.onboard(fullRequest, key)

    expect(repeat.body.person.name).toBe('Annie')
  })

  test('the same key with another body answers 409 and creates nothing', async () => {
    const { asUser, user, countProfiles } = await setup()
    const key = randomUUID()
    await asUser.onboard(fullRequest, key)

    const response = await asUser.onboard(
      { ...fullRequest, name: 'Other' },
      key,
    )

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('IDEMPOTENCY_KEY_REUSED')
    expect(await countProfiles(user.accountId)).toBe(1)
  })

  test('two simultaneous requests with one key create one profile', async () => {
    const { asUser, user, countProfiles } = await setup()
    const key = randomUUID()

    const responses = await Promise.all([
      asUser.onboard(fullRequest, key),
      asUser.onboard(fullRequest, key),
      asUser.onboard(fullRequest, key),
    ])

    expect(responses.map(({ status }) => status)).toEqual([201, 201, 201])
    expect(new Set(responses.map(({ body }) => body.person.id)).size).toBe(1)
    expect(await countProfiles(user.accountId)).toBe(1)
  })

  test('another account with the same key gets its own profile', async () => {
    const { asUser, asOtherUser } = await setup()
    const key = randomUUID()
    const first = await asUser.onboard(fullRequest, key)

    const other = await asOtherUser.onboard(
      { ...fullRequest, name: 'Zoe' },
      key,
    )

    expect(other.status).toBe(201)
    expect(other.body.person.id).not.toBe(first.body.person.id)
    expect(other.body.person.name).toBe('Zoe')
  })

  test('a key older than 24 hours is ignored and removed', async () => {
    const { asUser, prisma, user, countKeys } = await setup()
    const key = randomUUID()
    const first = await asUser.onboard(fullRequest, key)
    await prisma.onboardingRequest.updateMany({
      where: { accountId: user.accountId },
      data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    })

    const again = await asUser.onboard(fullRequest, key)

    expect(again.status).toBe(201)
    expect(again.body.person.id).not.toBe(first.body.person.id)
    expect(await countKeys(user.accountId)).toBe(1)
  })

  test('deleting the profile removes its key', async () => {
    const { asUser, user, countKeys } = await setup()
    const first = await asUser.onboard(fullRequest, randomUUID())

    await asUser.remove(first.body.person.id)

    expect(await countKeys(user.accountId)).toBe(0)
  })

  test.each([
    ['missing', undefined],
    ['empty', ''],
    ['too short', 'a'.repeat(15)],
    ['too long', 'a'.repeat(65)],
    ['with a space', `${'a'.repeat(15)} b`],
    ['with a slash', `${'a'.repeat(15)}/b`],
  ])('rejects a key that is %s', async (_name, key) => {
    const { asUser, user, countProfiles } = await setup()

    const response = await asUser.onboard(fullRequest, key)

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('IDEMPOTENCY_KEY_INVALID')
    expect(await countProfiles(user.accountId)).toBe(0)
  })
})

describe('onboarding is all or nothing', () => {
  test.each([
    [
      'macros that do not match the calories',
      {
        goal: {
          mode: 'MANUAL',
          dailyKcal: 2000,
          proteinG: 300,
          fatG: 300,
          carbsG: 300,
        },
      },
      'GOAL_MACROS_MISMATCH',
      422,
    ],
    [
      'an estimated goal without any body parameters',
      { bodyParameters: undefined },
      'BODY_PARAMETERS_REQUIRED',
      422,
    ],
    [
      'a minor',
      { dateOfBirth: birthDateForAge(17) },
      'PERSON_AGE_NOT_SUPPORTED',
      422,
    ],
    [
      'an unsupported age',
      { dateOfBirth: birthDateForAge(10) },
      'PERSON_AGE_NOT_SUPPORTED',
      422,
    ],
  ])('creates nothing for %s', async (_name, override, code, status) => {
    const { asUser, user, countProfiles, countKeys } = await setup()
    const body = { ...fullRequest, ...override }

    const response = await asUser.onboard(body, randomUUID())

    expect(response.status).toBe(status)
    expect(response.body.code).toBe(code)
    expect(await countProfiles(user.accountId)).toBe(0)
    expect(await countKeys(user.accountId)).toBe(0)
  })

  test('a rejected request can be repeated with the same key once fixed', async () => {
    const { asUser, user, countProfiles } = await setup()
    const key = randomUUID()
    const rejected = await asUser.onboard(
      { ...fullRequest, dateOfBirth: birthDateForAge(10) },
      key,
    )

    const fixed = await asUser.onboard(fullRequest, key)

    expect(rejected.status).toBe(422)
    expect(fixed.status).toBe(201)
    expect(await countProfiles(user.accountId)).toBe(1)
  })

  test('answers 409 and creates nothing when the profile limit is full', async () => {
    const { asUser, user, countProfiles, countKeys } = await setup()
    await asUser.create({ name: 'One', dateOfBirth: birthDateForAge(30) })
    await asUser.create({ name: 'Two', dateOfBirth: birthDateForAge(31) })

    const response = await asUser.onboard(fullRequest, randomUUID())

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('PROFILE_LIMIT_REACHED')
    expect(await countProfiles(user.accountId)).toBe(2)
    expect(await countKeys(user.accountId)).toBe(0)
  })

  test('two different keys race for one free slot: one wins, one gets 409', async () => {
    const { asUser, user, countProfiles } = await setup()
    await asUser.create({ name: 'One', dateOfBirth: birthDateForAge(30) })

    const responses = await Promise.all([
      asUser.onboard(fullRequest, randomUUID()),
      asUser.onboard({ ...fullRequest, name: 'Other' }, randomUUID()),
    ])

    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409])
    expect(await countProfiles(user.accountId)).toBe(2)
  })

  test('a failure after every write leaves no profile and no key', async () => {
    const { app, asUser, user, countProfiles, countKeys } = await setup()
    const people = app.get(PeopleService)
    const original = people.withAccountLock.bind(people)
    vi.spyOn(people, 'withAccountLock').mockImplementationOnce(
      (accountId, work) =>
        original(accountId, async (tx) => {
          await work(tx)
          throw new Error('simulated failure')
        }),
    )
    onTestFinished(() => {
      vi.restoreAllMocks()
    })
    const key = randomUUID()

    const failed = await asUser.onboard(fullRequest, key)
    const retried = await asUser.onboard(fullRequest, key)

    expect(failed.status).toBe(500)
    expect(retried.status).toBe(201)
    expect(await countProfiles(user.accountId)).toBe(1)
    expect(await countKeys(user.accountId)).toBe(1)
    expect(
      await app.get(PrismaService).personAllergy.count({
        where: { personProfile: { accountId: user.accountId } },
      }),
    ).toBe(fullRequest.allergies.items.length)
  })

  test.each([
    [
      'the same allergen twice',
      {
        allergies: {
          status: 'HAS_ALLERGIES',
          items: [{ allergenCode: 'MILK' }, { allergenCode: 'MILK' }],
        },
      },
    ],
    [
      'the same OTHER label written differently',
      {
        allergies: {
          status: 'HAS_ALLERGIES',
          items: [
            { allergenCode: 'OTHER', customLabel: 'Kiwi' },
            { allergenCode: 'OTHER', customLabel: ' kiwi ' },
          ],
        },
      },
    ],
    [
      'the same exclusion written differently',
      {
        exclusions: [{ ingredientName: 'Kale' }, { ingredientName: ' kale' }],
      },
    ],
    [
      'the same ingredient rated twice',
      {
        preferences: [
          { ingredientName: 'Beans', rating: 1 },
          { ingredientName: 'beans', rating: 5 },
        ],
      },
    ],
    ['an unknown field', { nickname: 'Annie' }],
    [
      'an invalid allergy',
      {
        allergies: {
          status: 'HAS_ALLERGIES',
          items: [{ allergenCode: 'OTHER' }],
        },
      },
    ],
    [
      'an invalid rating',
      { preferences: [{ ingredientName: 'x', rating: 9 }] },
    ],
    ['a name with a NUL character', { name: 'An\u0000na' }],
  ])('rejects %s and creates nothing', async (_name, override) => {
    const { asUser, user, countProfiles } = await setup()

    const response = await asUser.onboard(
      { ...fullRequest, ...override },
      randomUUID(),
    )

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
    expect(await countProfiles(user.accountId)).toBe(0)
  })
})

describe('POST /people/goals/estimate', () => {
  const previewRequest = {
    ...bodyParameters,
    dateOfBirth: birthDateForAge(30),
    goalType: 'MAINTAIN',
  }

  test('returns an estimate and stores nothing', async () => {
    const { asUser, user, countProfiles } = await setup()

    const response = await asUser.previewGoal(previewRequest)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      calculationMethod: 'DRI_2023_ADULT',
      isEstimate: true,
    })
    expect(response.body.estimatedMaintenanceKcal).toBeGreaterThan(0)
    expect(await countProfiles(user.accountId)).toBe(0)
  })

  test('matches the estimate of an existing profile', async () => {
    const { asUser } = await setup()
    const created = await asUser.create({
      name: 'Anna',
      dateOfBirth: previewRequest.dateOfBirth,
    })

    const bound = await asUser.estimateGoal(created.body.id, {
      ...bodyParameters,
      goalType: 'MAINTAIN',
    })
    const preview = await asUser.previewGoal(previewRequest)

    expect(preview.body).toEqual(bound.body)
  })

  test('uses the growth equations at 18', async () => {
    const { asUser } = await setup()

    const response = await asUser.previewGoal({
      ...previewRequest,
      dateOfBirth: birthDateForAge(18),
    })

    expect(response.status).toBe(200)
    expect(response.body.calculationMethod).toBe('DRI_2023_AGES_3_18')
  })

  test.each([
    [
      'an unsupported age',
      { dateOfBirth: birthDateForAge(10) },
      'PERSON_AGE_NOT_SUPPORTED',
    ],
    [
      'a minor',
      { dateOfBirth: birthDateForAge(17) },
      'PERSON_AGE_NOT_SUPPORTED',
    ],
    ['a missing height', { heightCm: undefined }, 'VALIDATION_FAILED'],
    ['an unknown field', { nickname: 'x' }, 'VALIDATION_FAILED'],
    ['an invalid date of birth', { dateOfBirth: 'soon' }, 'VALIDATION_FAILED'],
  ])('rejects %s', async (_name, override, code) => {
    const { asUser } = await setup()

    const response = await asUser.previewGoal({
      ...previewRequest,
      ...override,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe(code)
  })

  test('answers 401 without a token', async () => {
    const { server } = await setup()

    const response = await request(server)
      .post('/api/v1/people/goals/estimate')
      .send(previewRequest)

    expect(response.status).toBe(401)
  })
})
