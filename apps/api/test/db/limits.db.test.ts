import { randomUUID } from 'node:crypto'

import { describe, expect, test } from 'vitest'

import { PrismaService } from '../../src/prisma/prisma.service.js'
import {
  MAX_ALLERGIES,
  MAX_EXCLUSIONS,
  MAX_PREFERENCES,
} from '../../src/restrictions/restriction-limits.js'
import { birthDateForAge } from '../support/dates.js'
import { createConsentedActor } from '../support/factories.js'
import {
  createPeopleClient,
  type PeopleClient,
} from '../support/people-client.js'
import { createTestApp } from '../support/test-app.js'

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
  return {
    app,
    prisma,
    user,
    asUser: createPeopleClient(app.getHttpServer(), user),
  }
}

async function createPerson(api: PeopleClient, age = 30) {
  const response = await api.create({
    name: 'Anna',
    dateOfBirth: birthDateForAge(age),
  })
  expect(response.status).toBe(201)
  return response.body.id
}

describe('restriction caps', () => {
  const kinds = [
    {
      kind: 'allergies',
      limit: MAX_ALLERGIES,
      fill: (prisma: PrismaService, personProfileId: string, count: number) =>
        prisma.personAllergy.createMany({
          data: Array.from({ length: count }, (_, index) => ({
            personProfileId,
            allergenCode: 'OTHER' as const,
            customLabel: `label-${index}`,
            normalizedLabel: `label-${index}`,
          })),
        }),
      body: (index: number) => ({
        allergenCode: 'OTHER',
        customLabel: `new-${index}`,
      }),
    },
    {
      kind: 'exclusions',
      limit: MAX_EXCLUSIONS,
      fill: (prisma: PrismaService, personProfileId: string, count: number) =>
        prisma.personExclusion.createMany({
          data: Array.from({ length: count }, (_, index) => ({
            personProfileId,
            ingredientName: `item-${index}`,
            normalizedName: `item-${index}`,
          })),
        }),
      body: (index: number) => ({ ingredientName: `new-${index}` }),
    },
    {
      kind: 'preferences',
      limit: MAX_PREFERENCES,
      fill: (prisma: PrismaService, personProfileId: string, count: number) =>
        prisma.personFoodPreference.createMany({
          data: Array.from({ length: count }, (_, index) => ({
            personProfileId,
            ingredientName: `item-${index}`,
            normalizedName: `item-${index}`,
            rating: 3,
          })),
        }),
      body: (index: number) => ({ ingredientName: `new-${index}`, rating: 4 }),
    },
  ] as const

  test.each(kinds)(
    '$kind: the last free place is usable and the next one is refused',
    async ({ kind, limit, fill, body }) => {
      const { prisma, asUser } = await setup()
      const personId = await createPerson(asUser)
      await fill(prisma, personId, limit - 1)
      const api = asUser.restrictions(kind)

      const last = await api.add(personId, body(1))
      const over = await api.add(personId, body(2))
      const listed = await api.list(personId)

      expect(last.status).toBe(201)
      expect(over.status).toBe(409)
      expect(over.body.code).toBe('RESTRICTION_LIMIT_REACHED')
      expect(over.body.details).toEqual({ limit })
      expect(listed.body).toHaveLength(limit)
    },
  )

  test.each(kinds)(
    '$kind: a full list of one profile does not block another profile',
    async ({ kind, limit, fill, body }) => {
      const { prisma, asUser } = await setup()
      const full = await createPerson(asUser)
      const other = await createPerson(asUser)
      await fill(prisma, full, limit)

      const response = await asUser.restrictions(kind).add(other, body(1))

      expect(response.status).toBe(201)
    },
  )

  test.each([
    [
      'allergies',
      {
        allergies: Array.from({ length: MAX_ALLERGIES + 1 }, (_, index) => ({
          allergenCode: 'OTHER',
          customLabel: `label-${index}`,
        })),
      },
    ],
    [
      'exclusions',
      {
        exclusions: Array.from({ length: MAX_EXCLUSIONS + 1 }, (_, index) => ({
          ingredientName: `item-${index}`,
        })),
      },
    ],
    [
      'preferences',
      {
        preferences: Array.from(
          { length: MAX_PREFERENCES + 1 },
          (_, index) => ({ ingredientName: `item-${index}`, rating: 3 }),
        ),
      },
    ],
  ])(
    'onboarding refuses too many %s and creates nothing',
    async (_kind, list) => {
      const { asUser, prisma, user } = await setup()

      const response = await asUser.onboard(
        { name: 'Anna', dateOfBirth: birthDateForAge(30), ...list },
        randomUUID(),
      )

      expect(response.status).toBe(422)
      expect(response.body.code).toBe('VALIDATION_FAILED')
      expect(
        await prisma.personProfile.count({
          where: { accountId: user.accountId },
        }),
      ).toBe(0)
    },
  )

  test('onboarding accepts a full list of allergies', async () => {
    const { asUser } = await setup()

    const response = await asUser.onboard(
      {
        name: 'Anna',
        dateOfBirth: birthDateForAge(30),
        allergies: Array.from({ length: MAX_ALLERGIES }, (_, index) => ({
          allergenCode: 'OTHER',
          customLabel: `label-${index}`,
        })),
      },
      randomUUID(),
    )

    expect(response.status).toBe(201)
    expect(response.body.allergies).toHaveLength(MAX_ALLERGIES)
  })
})

describe('total profile cap', () => {
  const TOTAL = 20

  async function setupWithArchivedProfiles(count: number) {
    const context = await setup()
    await context.prisma.personProfile.createMany({
      data: Array.from({ length: count }, (_, index) => ({
        accountId: context.user.accountId,
        name: `Archived ${index}`,
        dateOfBirth: new Date('1990-05-17T00:00:00Z'),
        archivedAt: new Date(),
      })),
    })
    return context
  }

  test('refuses a new profile once active and archived profiles reach the cap', async () => {
    const { asUser } = await setupWithArchivedProfiles(TOTAL - 1)

    const last = await asUser.create({
      name: 'Last',
      dateOfBirth: birthDateForAge(30),
    })
    const over = await asUser.create({
      name: 'Over',
      dateOfBirth: birthDateForAge(30),
    })

    expect(last.status).toBe(201)
    expect(over.status).toBe(409)
    expect(over.body.code).toBe('PROFILE_TOTAL_LIMIT_REACHED')
    expect(over.body.details).toEqual({ limit: TOTAL })
  })

  test('onboarding is refused too and creates nothing', async () => {
    const { asUser, prisma, user } = await setupWithArchivedProfiles(TOTAL)

    const response = await asUser.onboard(
      { name: 'Anna', dateOfBirth: birthDateForAge(30) },
      randomUUID(),
    )

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('PROFILE_TOTAL_LIMIT_REACHED')
    expect(
      await prisma.personProfile.count({
        where: { accountId: user.accountId },
      }),
    ).toBe(TOTAL)
  })

  test('deleting an archived profile makes room again', async () => {
    const { asUser, prisma, user } = await setupWithArchivedProfiles(TOTAL)
    const archived = await prisma.personProfile.findFirstOrThrow({
      where: { accountId: user.accountId },
      select: { id: true },
    })

    await asUser.remove(archived.id)
    const created = await asUser.create({
      name: 'Anna',
      dateOfBirth: birthDateForAge(30),
    })

    expect(created.status).toBe(201)
  })

  test('restoring an archived profile is not blocked by the total', async () => {
    const { asUser, prisma, user } = await setupWithArchivedProfiles(TOTAL)
    const archived = await prisma.personProfile.findFirstOrThrow({
      where: { accountId: user.accountId },
      select: { id: true },
    })

    const restored = await asUser.restore(archived.id)

    expect(restored.status).toBe(200)
    expect(restored.body.archivedAt).toBeNull()
  })

  test('a full total of another account does not block this one', async () => {
    const { app, prisma } = await setupWithArchivedProfiles(TOTAL)
    const other = await createConsentedActor(prisma)
    const asOther = createPeopleClient(app.getHttpServer(), other)

    const response = await asOther.create({
      name: 'Anna',
      dateOfBirth: birthDateForAge(30),
    })

    expect(response.status).toBe(201)
  })
})

describe('automatic estimate up to age 70', () => {
  test('is available at 70 and reported as a capability', async () => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser, 70)

    const detail = await asUser.get(personId)
    const estimate = await asUser.estimateGoal(personId, {
      ...bodyParameters,
      goalType: 'MAINTAIN',
    })

    expect(detail.body.capabilities.goalEstimation).toBe(true)
    expect(estimate.status).toBe(200)
  })

  test('is unavailable at 71 but a manual goal still works', async () => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser, 71)

    const detail = await asUser.get(personId)
    const estimate = await asUser.estimateGoal(personId, {
      ...bodyParameters,
      goalType: 'MAINTAIN',
    })
    const estimated = await asUser.saveGoal(personId, {
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2000,
      ...bodyParameters,
    })
    const manual = await asUser.saveGoal(personId, {
      mode: 'MANUAL',
      dailyKcal: 2000,
    })

    const withoutParameters = await asUser.estimateGoal(personId, {
      goalType: 'MAINTAIN',
    })

    expect(withoutParameters.status).toBe(422)
    expect(withoutParameters.body.code).toBe('GOAL_ESTIMATION_UNAVAILABLE')
    expect(detail.body.capabilities.goalEstimation).toBe(false)
    expect(estimate.status).toBe(422)
    expect(estimate.body.code).toBe('GOAL_ESTIMATION_UNAVAILABLE')
    expect(estimated.status).toBe(422)
    expect(estimated.body.code).toBe('GOAL_ESTIMATION_UNAVAILABLE')
    expect(manual.status).toBe(200)
  })

  test('the stateless preview and onboarding agree', async () => {
    const { asUser, prisma, user } = await setup()
    const dateOfBirth = birthDateForAge(71)

    const preview = await asUser.previewGoal({
      ...bodyParameters,
      dateOfBirth,
      goalType: 'MAINTAIN',
    })
    const estimated = await asUser.onboard(
      {
        name: 'Anna',
        dateOfBirth,
        bodyParameters,
        goal: { mode: 'ESTIMATED', goalType: 'MAINTAIN', dailyKcal: 2000 },
      },
      randomUUID(),
    )
    const manual = await asUser.onboard(
      {
        name: 'Anna',
        dateOfBirth,
        goal: { mode: 'MANUAL', dailyKcal: 2000 },
      },
      randomUUID(),
    )

    expect(preview.status).toBe(422)
    expect(preview.body.code).toBe('GOAL_ESTIMATION_UNAVAILABLE')
    expect(estimated.status).toBe(422)
    expect(estimated.body.code).toBe('GOAL_ESTIMATION_UNAVAILABLE')
    expect(manual.status).toBe(201)
    expect(
      await prisma.personProfile.count({
        where: { accountId: user.accountId },
      }),
    ).toBe(1)
  })
})
