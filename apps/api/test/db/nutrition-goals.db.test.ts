import request from 'supertest'
import { describe, expect, test } from 'vitest'
import * as zod from 'zod'

import { PrismaService } from '../../src/prisma/prisma.service.js'
import { birthDateForAge } from '../support/dates.js'
import { createConsentedActor } from '../support/factories.js'
import {
  createPeopleClient,
  type PeopleClient,
} from '../support/people-client.js'
import { createTestApp } from '../support/test-app.js'
import { createActor } from '../support/test-auth.js'

const createdPersonSchema = zod.object({ id: zod.string() })

const noAllergies = { status: 'NONE', warningAcknowledged: true } as const

const bodyParameters = {
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'ACTIVE',
  formulaSex: 'MALE',
} as const

async function setup() {
  const app = await createTestApp()
  const prisma = app.get(PrismaService)
  const user = await createConsentedActor(prisma)
  const otherUser = await createConsentedActor(prisma)
  const server = app.getHttpServer()
  return {
    server,
    prisma,
    user,
    asUser: createPeopleClient(server, user),
    asOtherUser: createPeopleClient(server, otherUser),
  }
}

async function createPerson(api: PeopleClient, age = 30) {
  const response = await api.create({
    name: 'Anna',
    dateOfBirth: birthDateForAge(age),
  })
  expect(response.status).toBe(201)
  return createdPersonSchema.parse(response.body).id
}

describe('body parameters', () => {
  test('answers 404 while nothing is stored', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.getBodyParameters(id)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('BODY_PARAMETERS_NOT_FOUND')
  })

  test('stores, reads and replaces the current values', async () => {
    const { asUser, prisma } = await setup()
    const id = await createPerson(asUser)

    const saved = await asUser.saveBodyParameters(id, bodyParameters)
    const replaced = await asUser.saveBodyParameters(id, {
      ...bodyParameters,
      weightKg: 72.5,
    })
    const read = await asUser.getBodyParameters(id)

    expect(saved.status).toBe(200)
    expect(replaced.status).toBe(200)
    expect(read.body).toMatchObject({ ...bodyParameters, weightKg: 72.5 })
    expect(
      await prisma.personBodyParameters.count({
        where: { personProfileId: id },
      }),
    ).toBe(1)
  })

  test('deletes the stored values', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveBodyParameters(id, bodyParameters)

    const removed = await asUser.removeBodyParameters(id)
    const afterwards = await asUser.getBodyParameters(id)
    const removedAgain = await asUser.removeBodyParameters(id)

    expect(removed.status).toBe(204)
    expect(afterwards.status).toBe(404)
    expect(removedAgain.status).toBe(404)
  })

  test.each([
    ['a height below the sanity limit', { heightCm: 20 }],
    ['a weight above the sanity limit', { weightKg: 900 }],
    ['an unknown activity level', { activityLevel: 'EXTREME' }],
    ['an unknown field', { age: 30 }],
  ])('rejects %s', async (_name, override) => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.saveBodyParameters(id, {
      ...bodyParameters,
      ...override,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })

  test('is removed together with the profile', async () => {
    const { asUser, prisma } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveBodyParameters(id, bodyParameters)

    await asUser.remove(id)

    expect(
      await prisma.personBodyParameters.count({
        where: { personProfileId: id },
      }),
    ).toBe(0)
  })

  test('is hidden from another account on every route', async () => {
    const { asUser, asOtherUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveBodyParameters(id, bodyParameters)

    const responses = await Promise.all([
      asOtherUser.getBodyParameters(id),
      asOtherUser.saveBodyParameters(id, bodyParameters),
      asOtherUser.removeBodyParameters(id),
    ])

    expect(responses.map(({ status }) => status)).toEqual([404, 404, 404])
    expect(responses.map(({ body }) => body.code)).toEqual(
      Array(3).fill('PERSON_NOT_FOUND'),
    )
    expect((await asUser.getBodyParameters(id)).status).toBe(200)
  })
})

describe('estimate preview', () => {
  test('returns maintenance energy computed from the stored birth date and the request', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser, 30)

    const response = await asUser.estimateGoal(id, {
      ...bodyParameters,
      goalType: 'MAINTAIN',
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      estimatedMaintenanceKcal: 2902,
      calculationMethod: 'DRI_2023_ADULT',
      isEstimate: true,
      proposedMacros: { proteinG: 145, fatG: 97, carbsG: 363 },
    })
    expect(response.body.assumptions).toContain(
      'MAINTENANCE_ENERGY_NOT_A_TARGET',
    )
  })

  test('saves nothing', async () => {
    const { asUser, prisma } = await setup()
    const id = await createPerson(asUser)

    await asUser.estimateGoal(id, { ...bodyParameters, goalType: 'GAIN' })

    expect((await asUser.getGoal(id)).status).toBe(404)
    expect(
      await prisma.personBodyParameters.count({
        where: { personProfileId: id },
      }),
    ).toBe(0)
  })

  test('does not lower or raise the figure for a weight-change goal', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const [lose, gain] = await Promise.all([
      asUser.estimateGoal(id, { ...bodyParameters, goalType: 'LOSE' }),
      asUser.estimateGoal(id, { ...bodyParameters, goalType: 'GAIN' }),
    ])

    expect(lose.body.estimatedMaintenanceKcal).toBe(2902)
    expect(gain.body.estimatedMaintenanceKcal).toBe(2902)
  })

  test('uses the stored body parameters when the request has none', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveBodyParameters(id, bodyParameters)

    const response = await asUser.estimateGoal(id, { goalType: 'MAINTAIN' })

    expect(response.body.estimatedMaintenanceKcal).toBe(2902)
  })

  test('lets a value in the request win over the stored one', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveBodyParameters(id, bodyParameters)

    const response = await asUser.estimateGoal(id, {
      goalType: 'MAINTAIN',
      activityLevel: 'INACTIVE',
    })

    expect(response.body.estimatedMaintenanceKcal).toBe(2520)
  })

  test('asks for the inputs when there are none', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.estimateGoal(id, { goalType: 'MAINTAIN' })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('BODY_PARAMETERS_REQUIRED')
  })

  test('uses the ages 3-18 method with a growth allowance at 18', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser, 18)

    const response = await asUser.estimateGoal(id, {
      ...bodyParameters,
      formulaSex: 'FEMALE',
      goalType: 'MAINTAIN',
    })

    expect(response.status).toBe(200)
    expect(response.body.calculationMethod).toBe('DRI_2023_AGES_3_18')
    expect(response.body.assumptions).toContain('INCLUDES_GROWTH_ALLOWANCE')
  })

  test('rejects an unknown field', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.estimateGoal(id, {
      ...bodyParameters,
      goalType: 'MAINTAIN',
      ageYears: 99,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })

  test('rejects the CUSTOM goal type', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.estimateGoal(id, {
      ...bodyParameters,
      goalType: 'CUSTOM',
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })
})

describe('saving a goal', () => {
  test('answers 404 while no goal is set', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.getGoal(id)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('GOAL_NOT_FOUND')
  })

  test('saves a manual goal without height or weight', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const saved = await asUser.saveGoal(id, { mode: 'MANUAL', dailyKcal: 2200 })
    const read = await asUser.getGoal(id)

    expect(saved.status).toBe(200)
    expect(read.body).toMatchObject({
      mode: 'MANUAL',
      goalType: 'CUSTOM',
      dailyKcal: 2200,
      estimatedMaintenanceKcal: null,
      calculationMethod: null,
      revision: 1,
      reviewRequiredAt: null,
      macroCheck: 'SKIPPED_INCOMPLETE',
      warnings: [],
    })
    expect(new Date(read.body.confirmedAt).toISOString()).toBe(
      read.body.confirmedAt,
    )
  })

  test('counts a revision on every save', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    await asUser.saveGoal(id, { mode: 'MANUAL', dailyKcal: 2200 })
    const second = await asUser.saveGoal(id, {
      mode: 'MANUAL',
      dailyKcal: 2300,
    })

    expect(second.body).toMatchObject({ revision: 2, dailyKcal: 2300 })
  })

  test('stores the confirmed calories next to the computed estimate', async () => {
    const { asUser, prisma } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'LOSE',
      dailyKcal: 2400,
      ...bodyParameters,
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      mode: 'ESTIMATED',
      goalType: 'LOSE',
      dailyKcal: 2400,
      estimatedMaintenanceKcal: 2902,
      calculationMethod: 'DRI_2023_ADULT',
    })
    expect(response.body.estimatedAt).not.toBeNull()
    expect(
      await prisma.personBodyParameters.count({
        where: { personProfileId: id },
      }),
    ).toBe(0)
  })

  test('computes the estimate from the stored body parameters when the request has none', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveBodyParameters(id, bodyParameters)

    const response = await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2900,
    })

    expect(response.body.estimatedMaintenanceKcal).toBe(2902)
  })

  test('never takes the formula result from the client', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2900,
      estimatedMaintenanceKcal: 5000,
      ...bodyParameters,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })

  test('forgets the estimate when the goal becomes manual', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2900,
      ...bodyParameters,
    })

    const response = await asUser.saveGoal(id, {
      mode: 'MANUAL',
      dailyKcal: 2000,
    })

    expect(response.body).toMatchObject({
      mode: 'MANUAL',
      estimatedMaintenanceKcal: null,
      calculationMethod: null,
      estimatedAt: null,
    })
  })

  test('asks for the inputs of an estimated goal', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2900,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('BODY_PARAMETERS_REQUIRED')
  })

  test('refuses the CUSTOM type for an estimated goal', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'CUSTOM',
      dailyKcal: 2900,
      ...bodyParameters,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })

  test.each([
    ['calories below the sanity limit', { dailyKcal: 100 }],
    ['calories above the sanity limit', { dailyKcal: 50000 }],
    ['a negative macro', { proteinG: -5 }],
    ['a fractional macro', { fatG: 10.5 }],
  ])('rejects %s', async (_name, override) => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.saveGoal(id, {
      mode: 'MANUAL',
      dailyKcal: 2200,
      ...override,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })
})

describe('macros', () => {
  const consistent = { dailyKcal: 2030, proteinG: 100, fatG: 70, carbsG: 250 }

  test('accepts macros that match the calories', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.saveGoal(id, {
      mode: 'MANUAL',
      ...consistent,
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ macroCheck: 'OK', warnings: [] })
  })

  test('refuses macros that differ by more than 10% until confirmed', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    const mismatching = { mode: 'MANUAL', ...consistent, dailyKcal: 2600 }

    const refused = await asUser.saveGoal(id, mismatching)
    const confirmed = await asUser.saveGoal(id, {
      ...mismatching,
      confirmMacroMismatch: true,
    })
    const read = await asUser.getGoal(id)

    expect(refused.status).toBe(422)
    expect(refused.body).toMatchObject({
      code: 'GOAL_MACROS_MISMATCH',
      details: { calculatedKcal: 2030, dailyKcal: 2600 },
    })
    expect(confirmed.status).toBe(200)
    expect(confirmed.body.macroCheck).toBe('MISMATCH_CONFIRMED')
    expect(read.body.warnings).toEqual([
      {
        code: 'MACROS_ENERGY_MISMATCH',
        calculatedKcal: 2030,
        dailyKcal: 2600,
      },
    ])
  })

  test('does not store anything when the mismatch is refused', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    await asUser.saveGoal(id, {
      mode: 'MANUAL',
      ...consistent,
      dailyKcal: 2600,
    })

    expect((await asUser.getGoal(id)).status).toBe(404)
  })

  test('skips the check when the macros are incomplete', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const response = await asUser.saveGoal(id, {
      mode: 'MANUAL',
      dailyKcal: 2600,
      proteinG: 100,
      fatG: 70,
    })

    expect(response.status).toBe(200)
    expect(response.body.macroCheck).toBe('SKIPPED_INCOMPLETE')
  })
})

describe('plan readiness', () => {
  test('is not ready until a goal exists', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)

    const detail = await asUser.get(id)
    const list = await asUser.list()

    expect(detail.body.planReadiness).toEqual({
      ready: false,
      reasons: ['MISSING_GOAL', 'ALLERGY_STATUS_MISSING'],
    })
    expect(list.body[0].planReadiness.reasons).toEqual([
      'MISSING_GOAL',
      'ALLERGY_STATUS_MISSING',
    ])
    expect(detail.body.goal).toBeNull()
  })

  test('is ready once a goal is saved', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.setAllergyStatus(id, noAllergies)
    await asUser.saveGoal(id, { mode: 'MANUAL', dailyKcal: 2200 })

    const detail = await asUser.get(id)

    expect(detail.body.planReadiness).toEqual({ ready: true, reasons: [] })
    expect(detail.body.goal).toEqual({
      mode: 'MANUAL',
      dailyKcal: 2200,
      goalType: 'CUSTOM',
    })
  })

  test('asks for a review after a real date-of-birth change of an estimated goal', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.setAllergyStatus(id, noAllergies)
    await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2900,
      ...bodyParameters,
    })

    await asUser.patch(id, { dateOfBirth: birthDateForAge(35) })
    const reviewed = await asUser.getGoal(id)
    const detail = await asUser.get(id)
    await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2800,
      ...bodyParameters,
    })

    expect(reviewed.body.reviewRequiredAt).not.toBeNull()
    expect(detail.body.planReadiness).toEqual({
      ready: false,
      reasons: ['GOAL_REVIEW_REQUIRED'],
    })
    expect((await asUser.getGoal(id)).body.reviewRequiredAt).toBeNull()
    expect((await asUser.get(id)).body.planReadiness.ready).toBe(true)
  })

  test('leaves a manual goal alone when the date of birth changes', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.setAllergyStatus(id, noAllergies)
    await asUser.saveGoal(id, { mode: 'MANUAL', dailyKcal: 2200 })

    await asUser.patch(id, { dateOfBirth: birthDateForAge(35) })

    expect((await asUser.get(id)).body.planReadiness.ready).toBe(true)
  })

  test('does not ask for a review when only the name or the same date is sent', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2900,
      ...bodyParameters,
    })

    await asUser.patch(id, { name: 'Boris' })
    await asUser.patch(id, { dateOfBirth: birthDateForAge(30) })

    expect((await asUser.getGoal(id)).body.reviewRequiredAt).toBeNull()
  })

  test('reports a goal whose method no longer fits the new age', async () => {
    const { asUser } = await setup()
    const id = await createPerson(asUser, 30)
    await asUser.setAllergyStatus(id, noAllergies)
    await asUser.saveGoal(id, {
      mode: 'ESTIMATED',
      goalType: 'LOSE',
      dailyKcal: 2400,
      ...bodyParameters,
    })

    await asUser.patch(id, { dateOfBirth: birthDateForAge(18) })
    const detail = await asUser.get(id)

    expect(detail.body.planReadiness).toEqual({
      ready: false,
      reasons: ['GOAL_REVIEW_REQUIRED', 'GOAL_NOT_VALID_FOR_AGE'],
    })
  })
})

describe('a profile created before the adults-only rule', () => {
  test('keeps the under-18 rules for goals and macros', async () => {
    const { prisma, user, asUser } = await setup()
    const { id } = await prisma.personProfile.create({
      data: {
        accountId: user.accountId,
        name: 'Legacy',
        dateOfBirth: new Date(`${birthDateForAge(15)}T00:00:00Z`),
      },
      select: { id: true },
    })

    const weightLoss = await asUser.saveGoal(id, {
      mode: 'MANUAL',
      goalType: 'LOSE',
      dailyKcal: 2000,
    })
    const estimate = await asUser.estimateGoal(id, {
      ...bodyParameters,
      goalType: 'MAINTAIN',
    })

    expect(weightLoss.status).toBe(422)
    expect(weightLoss.body.code).toBe('GOAL_TYPE_NOT_SUPPORTED_FOR_AGE')
    expect(estimate.body.proposedMacros).toBeNull()
  })
})

describe('access control', () => {
  test('hides a goal of another account on every route', async () => {
    const { asUser, asOtherUser } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveGoal(id, { mode: 'MANUAL', dailyKcal: 2200 })

    const responses = await Promise.all([
      asOtherUser.getGoal(id),
      asOtherUser.saveGoal(id, { mode: 'MANUAL', dailyKcal: 2000 }),
      asOtherUser.estimateGoal(id, { ...bodyParameters, goalType: 'MAINTAIN' }),
    ])

    expect(responses.map(({ status }) => status)).toEqual([404, 404, 404])
    expect(responses.map(({ body }) => body.code)).toEqual(
      Array(3).fill('PERSON_NOT_FOUND'),
    )
    expect((await asUser.getGoal(id)).body.dailyKcal).toBe(2200)
  })

  test('is removed together with the profile', async () => {
    const { asUser, prisma } = await setup()
    const id = await createPerson(asUser)
    await asUser.saveGoal(id, { mode: 'MANUAL', dailyKcal: 2200 })

    await asUser.remove(id)

    expect(
      await prisma.nutritionGoal.count({ where: { personProfileId: id } }),
    ).toBe(0)
  })

  test('answers 401 to an anonymous request and 403 before consents', async () => {
    const { server } = await setup()
    const newcomer = await createActor()
    const id = '00000000-0000-4000-8000-000000000000'

    const anonymous = await request(server).get(`/api/v1/people/${id}/goal`)
    const unconsented = await request(server)
      .get(`/api/v1/people/${id}/goal`)
      .set('Authorization', newcomer.authorization)

    expect(anonymous.status).toBe(401)
    expect(unconsented.status).toBe(403)
    expect(unconsented.body.code).toBe('CONSENT_REQUIRED')
  })
})
