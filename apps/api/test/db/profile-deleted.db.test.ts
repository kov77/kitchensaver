import { describe, expect, onTestFinished, test, vi } from 'vitest'

import { PeopleService } from '../../src/people/people.service.js'
import { PrismaService } from '../../src/prisma/prisma.service.js'
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
    asUser: createPeopleClient(app.getHttpServer(), user),
  }
}

async function createPerson(api: PeopleClient) {
  const response = await api.create({
    name: 'Anna',
    dateOfBirth: birthDateForAge(30),
  })
  expect(response.status).toBe(201)
  return response.body.id
}

describe('a profile deleted while a write is in flight', () => {
  // The ownership check passes, then the profile disappears before the write.
  function deleteProfileAfterCheck(
    people: PeopleService,
    prisma: PrismaService,
    method: 'assertExists' | 'getDateOfBirth',
  ) {
    onTestFinished(() => {
      vi.restoreAllMocks()
    })
    if (method === 'assertExists') {
      const original = people.assertExists.bind(people)
      vi.spyOn(people, 'assertExists').mockImplementationOnce(
        async (accountId, id) => {
          await original(accountId, id)
          await prisma.personProfile.delete({ where: { id } })
        },
      )
      return
    }
    const original = people.getDateOfBirth.bind(people)
    vi.spyOn(people, 'getDateOfBirth').mockImplementationOnce(
      async (accountId, id) => {
        const dateOfBirth = await original(accountId, id)
        await prisma.personProfile.delete({ where: { id } })
        return dateOfBirth
      },
    )
  }

  test.each([
    [
      'an allergy',
      'assertExists',
      (api: PeopleClient, id: string) =>
        api.restrictions('allergies').add(id, { allergenCode: 'MILK' }),
    ],
    [
      'an exclusion',
      'assertExists',
      (api: PeopleClient, id: string) =>
        api.restrictions('exclusions').add(id, { ingredientName: 'kale' }),
    ],
    [
      'a preference',
      'assertExists',
      (api: PeopleClient, id: string) =>
        api
          .restrictions('preferences')
          .add(id, { ingredientName: 'kale', rating: 3 }),
    ],
    [
      'body parameters',
      'assertExists',
      (api: PeopleClient, id: string) =>
        api.saveBodyParameters(id, bodyParameters),
    ],
    [
      'a goal',
      'getDateOfBirth',
      (api: PeopleClient, id: string) =>
        api.saveGoal(id, { mode: 'MANUAL', dailyKcal: 2000 }),
    ],
  ] as const)('answers 404 for %s', async (_name, method, write) => {
    const { app, prisma, asUser } = await setup()
    const personId = await createPerson(asUser)
    deleteProfileAfterCheck(app.get(PeopleService), prisma, method)

    const response = await write(asUser, personId)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('PERSON_NOT_FOUND')
  })
})
