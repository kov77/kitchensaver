import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { PrismaService } from '../../src/prisma/prisma.service.js'
import { birthDateForAge } from '../support/dates.js'
import { createConsentedActor } from '../support/factories.js'
import {
  createPeopleClient,
  type PeopleClient,
} from '../support/people-client.js'
import { createTestApp } from '../support/test-app.js'
import { createActor } from '../support/test-auth.js'

const none = { status: 'NONE', warningAcknowledged: true } as const
const unknown = { status: 'UNKNOWN', warningAcknowledged: true } as const

async function setup() {
  const app = await createTestApp()
  const prisma = app.get(PrismaService)
  const user = await createConsentedActor(prisma)
  const otherUser = await createConsentedActor(prisma)
  const server = app.getHttpServer()
  const asUser = createPeopleClient(server, user)
  return {
    server,
    prisma,
    user,
    asUser,
    asOtherUser: createPeopleClient(server, otherUser),
    allergies: asUser.restrictions('allergies'),
  }
}

async function createPerson(api: PeopleClient, name = 'Anna') {
  const response = await api.create({
    name,
    dateOfBirth: birthDateForAge(30),
  })
  expect(response.status).toBe(201)
  return response.body.id
}

describe('a new profile', () => {
  test('has not answered the allergy question', async () => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser)

    const detail = await asUser.get(personId)

    expect(detail.body.allergyStatus).toBeNull()
    expect(detail.body.allergyStatusAt).toBeNull()
    expect(detail.body.planReadiness.reasons).toContain(
      'ALLERGY_STATUS_MISSING',
    )
    expect(detail.body.planReadiness.ready).toBe(false)
  })
})

describe('PUT /people/:id/allergy-status', () => {
  test.each([none, unknown])('stores the answer %j', async (body) => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser)

    const response = await asUser.setAllergyStatus(personId, body)
    const detail = await asUser.get(personId)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      allergyStatus: body.status,
      allergyStatusAt: expect.any(String),
    })
    expect(detail.body.allergyStatus).toBe(body.status)
    expect(detail.body.allergyStatusAt).toBe(response.body.allergyStatusAt)
    expect(detail.body.planReadiness.reasons).not.toContain(
      'ALLERGY_STATUS_MISSING',
    )
  })

  test('lets the person change the answer', async () => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser)
    const first = await asUser.setAllergyStatus(personId, none)

    const second = await asUser.setAllergyStatus(personId, unknown)

    expect(second.body.allergyStatus).toBe('UNKNOWN')
    expect(Date.parse(second.body.allergyStatusAt)).toBeGreaterThanOrEqual(
      Date.parse(first.body.allergyStatusAt),
    )
  })

  test.each([
    ['no warning confirmation', { status: 'NONE' }],
    ['a refused warning', { status: 'NONE', warningAcknowledged: false }],
    [
      'a confirmation sent as text',
      { status: 'NONE', warningAcknowledged: 'true' },
    ],
    ['HAS_ALLERGIES', { status: 'HAS_ALLERGIES', warningAcknowledged: true }],
    ['an unknown status', { status: 'MAYBE', warningAcknowledged: true }],
    ['an empty body', {}],
    ['an unknown field', { ...none, note: 'x' }],
  ])('rejects %s and stores nothing', async (_name, body) => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser)

    const response = await asUser.setAllergyStatus(personId, body)
    const detail = await asUser.get(personId)

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
    expect(detail.body.allergyStatus).toBeNull()
  })

  test('refuses while allergies are listed and works after they are deleted', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    const added = await allergies.add(personId, { allergenCode: 'MILK' })

    const refused = await asUser.setAllergyStatus(personId, none)
    const stillListed = await asUser.get(personId)
    await allergies.remove(personId, added.body.id)
    const accepted = await asUser.setAllergyStatus(personId, none)

    expect(refused.status).toBe(409)
    expect(refused.body.code).toBe('ALLERGIES_EXIST')
    expect(stillListed.body.allergyStatus).toBe('HAS_ALLERGIES')
    expect(accepted.status).toBe(200)
  })

  test('works for an archived profile', async () => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser)
    await asUser.archive(personId)

    const response = await asUser.setAllergyStatus(personId, unknown)

    expect(response.status).toBe(200)
  })

  test('hides the profile of another account', async () => {
    const { asUser, asOtherUser } = await setup()
    const personId = await createPerson(asUser)

    const response = await asOtherUser.setAllergyStatus(personId, none)
    const detail = await asUser.get(personId)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('PERSON_NOT_FOUND')
    expect(detail.body.allergyStatus).toBeNull()
  })

  test('answers 404 for an id that is not a UUID', async () => {
    const { asUser } = await setup()

    const response = await asUser.setAllergyStatus('abc', none)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('PERSON_NOT_FOUND')
  })

  test('answers 401 without a token', async () => {
    const { server, asUser } = await setup()
    const personId = await createPerson(asUser)

    const response = await request(server)
      .put(`/api/v1/people/${personId}/allergy-status`)
      .send(none)

    expect(response.status).toBe(401)
  })

  test('answers 403 CONSENT_REQUIRED before consents are recorded', async () => {
    const { server, asUser } = await setup()
    const personId = await createPerson(asUser)
    const newcomer = await createActor()

    const response = await request(server)
      .put(`/api/v1/people/${personId}/allergy-status`)
      .set('Authorization', newcomer.authorization)
      .send(none)

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('CONSENT_REQUIRED')
  })
})

describe('the status follows the allergy list', () => {
  test('adding an allergy sets HAS_ALLERGIES even after an earlier "none"', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    await asUser.setAllergyStatus(personId, none)

    await allergies.add(personId, { allergenCode: 'PEANUT' })
    const detail = await asUser.get(personId)

    expect(detail.body.allergyStatus).toBe('HAS_ALLERGIES')
    expect(detail.body.allergyStatusAt).not.toBeNull()
    expect(detail.body.planReadiness.reasons).not.toContain(
      'ALLERGY_STATUS_MISSING',
    )
  })

  test('a second allergy does not change the time of the answer', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    await allergies.add(personId, { allergenCode: 'PEANUT' })
    const before = await asUser.get(personId)

    await allergies.add(personId, { allergenCode: 'EGG' })
    const after = await asUser.get(personId)

    expect(after.body.allergyStatusAt).toBe(before.body.allergyStatusAt)
  })

  test('deleting one of two allergies keeps the status', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    const first = await allergies.add(personId, { allergenCode: 'PEANUT' })
    await allergies.add(personId, { allergenCode: 'EGG' })

    await allergies.remove(personId, first.body.id)
    const detail = await asUser.get(personId)

    expect(detail.body.allergyStatus).toBe('HAS_ALLERGIES')
  })

  test('deleting the last allergy asks the question again', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    const added = await allergies.add(personId, { allergenCode: 'PEANUT' })

    await allergies.remove(personId, added.body.id)
    const detail = await asUser.get(personId)

    expect(detail.body.allergyStatus).toBeNull()
    expect(detail.body.allergyStatusAt).toBeNull()
    expect(detail.body.planReadiness.reasons).toContain(
      'ALLERGY_STATUS_MISSING',
    )
  })

  test('another profile of the same account keeps its own answer', async () => {
    const { asUser, allergies } = await setup()
    const first = await createPerson(asUser, 'Anna')
    const second = await createPerson(asUser, 'Ben')
    await asUser.setAllergyStatus(second, unknown)

    await allergies.add(first, { allergenCode: 'MILK' })

    expect((await asUser.get(second)).body.allergyStatus).toBe('UNKNOWN')
  })

  test('parallel allergies on one profile all land and the status is set', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)

    const responses = await Promise.all([
      allergies.add(personId, { allergenCode: 'MILK' }),
      allergies.add(personId, { allergenCode: 'EGG' }),
      allergies.add(personId, { allergenCode: 'SOY' }),
    ])
    const detail = await asUser.get(personId)
    const listed = await allergies.list(personId)

    expect(responses.map(({ status }) => status)).toEqual([201, 201, 201])
    expect(listed.body).toHaveLength(3)
    expect(detail.body.allergyStatus).toBe('HAS_ALLERGIES')
  })

  test('an allergy and a "none" answer sent together never contradict each other', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)

    const [added, answered] = await Promise.all([
      allergies.add(personId, { allergenCode: 'PEANUT' }),
      asUser.setAllergyStatus(personId, none),
    ])
    const detail = await asUser.get(personId)
    const listed = await allergies.list(personId)

    expect(added.status).toBe(201)
    expect([200, 409]).toContain(answered.status)
    expect(listed.body).toHaveLength(1)
    expect(detail.body.allergyStatus).toBe('HAS_ALLERGIES')
  })
})

describe('the allergy question in onboarding', () => {
  const profile = { name: 'Anna', dateOfBirth: birthDateForAge(30) }

  test('"yes" lists the allergies and sets the status', async () => {
    const { asUser } = await setup()

    const response = await asUser.onboard(
      {
        ...profile,
        allergies: {
          status: 'HAS_ALLERGIES',
          items: [{ allergenCode: 'PEANUT' }, { allergenCode: 'MILK' }],
        },
      },
      randomUUID(),
    )

    expect(response.status).toBe(201)
    expect(response.body.person.allergyStatus).toBe('HAS_ALLERGIES')
    expect(response.body.person.allergyStatusAt).not.toBeNull()
    expect(response.body.allergies).toHaveLength(2)
  })

  test.each([none, unknown])(
    '"%j" stores the answer and no allergies',
    async (answer) => {
      const { asUser } = await setup()

      const response = await asUser.onboard(
        { ...profile, allergies: answer },
        randomUUID(),
      )

      expect(response.status).toBe(201)
      expect(response.body.person.allergyStatus).toBe(answer.status)
      expect(response.body.person.allergyStatusAt).not.toBeNull()
      expect(response.body.allergies).toEqual([])
      expect(response.body.person.planReadiness.reasons).not.toContain(
        'ALLERGY_STATUS_MISSING',
      )
    },
  )

  test.each([
    ['no allergy answer at all', undefined],
    ['the old list form', [{ allergenCode: 'MILK' }]],
    ['"none" without the warning confirmation', { status: 'NONE' }],
    [
      '"unknown" with a refused warning',
      { status: 'UNKNOWN', warningAcknowledged: false },
    ],
    [
      '"none" together with allergies',
      { ...none, items: [{ allergenCode: 'MILK' }] },
    ],
    ['"yes" with an empty list', { status: 'HAS_ALLERGIES', items: [] }],
    ['"yes" without a list', { status: 'HAS_ALLERGIES' }],
    ['an unknown status', { status: 'MAYBE', warningAcknowledged: true }],
  ])('rejects %s and creates nothing', async (_name, allergies) => {
    const { asUser, prisma, user } = await setup()

    const response = await asUser.onboard(
      { ...profile, allergies },
      randomUUID(),
    )

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
    expect(
      await prisma.personProfile.count({
        where: { accountId: user.accountId },
      }),
    ).toBe(0)
  })

  test('a repeat returns the same answer', async () => {
    const { asUser } = await setup()
    const key = randomUUID()
    const body = { ...profile, allergies: unknown }
    const first = await asUser.onboard(body, key)

    const repeat = await asUser.onboard(body, key)

    expect(repeat.status).toBe(201)
    expect(repeat.body.person.id).toBe(first.body.person.id)
    expect(repeat.body.person.allergyStatus).toBe('UNKNOWN')
  })
})
