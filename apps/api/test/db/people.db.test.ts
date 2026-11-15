import request from 'supertest'
import { describe, expect, test } from 'vitest'
import * as zod from 'zod'

import { PrismaService } from '../../src/prisma/prisma.service.js'
import { createConsentedActor } from '../support/factories.js'
import {
  createPeopleClient,
  type PeopleClient,
} from '../support/people-client.js'
import { createTestApp } from '../support/test-app.js'
import { createActor } from '../support/test-auth.js'

const adultBirthDate = '1990-05-17'

const createdPersonSchema = zod.object({ id: zod.string() })

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

// The date of birth of a person who turns `years` on `daysFromBirthday` days from today (UTC).
function birthDateFor(years: number, daysFromBirthday: number) {
  const now = new Date()
  const year = now.getUTCFullYear() - years
  const month = now.getUTCMonth()
  const sameDay = new Date(Date.UTC(year, month, now.getUTCDate()))
  // Feb 29 has no counterpart in a non-leap year: use the last day of the month instead of rolling into March.
  const anniversary =
    sameDay.getUTCMonth() === month
      ? sameDay
      : new Date(Date.UTC(year, month + 1, 0))
  anniversary.setUTCDate(anniversary.getUTCDate() + daysFromBirthday)
  return isoDate(anniversary)
}

async function setup() {
  const app = await createTestApp()
  const prisma = app.get(PrismaService)
  const user = await createConsentedActor(prisma)
  const otherUser = await createConsentedActor(prisma)
  const server = app.getHttpServer()
  return {
    app,
    prisma,
    server,
    user,
    otherUser,
    asUser: createPeopleClient(server, user),
    asOtherUser: createPeopleClient(server, otherUser),
  }
}

async function createPerson(api: PeopleClient, name = 'Anna') {
  const response = await api.create({ name, dateOfBirth: adultBirthDate })
  expect(response.status).toBe(201)
  return createdPersonSchema.parse(response.body)
}

describe('create and read', () => {
  test('creates a profile and returns the computed age without storing it', async () => {
    const { asUser, prisma, user } = await setup()

    const response = await asUser.create({
      name: '  Anna  ',
      dateOfBirth: adultBirthDate,
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      name: 'Anna',
      dateOfBirth: adultBirthDate,
      archivedAt: null,
      capabilities: { goalEstimation: true },
    })
    expect(response.body.age).toBeGreaterThanOrEqual(36)
    const stored = await prisma.personProfile.findUniqueOrThrow({
      where: { id: response.body.id },
    })
    expect(stored.accountId).toBe(user.accountId)
    expect(Object.keys(stored)).not.toContain('age')
  })

  test('lists profiles without the date of birth', async () => {
    const { asUser } = await setup()
    await createPerson(asUser, 'Anna')

    const response = await asUser.list()

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0]).not.toHaveProperty('dateOfBirth')
    expect(response.body[0]).toMatchObject({ name: 'Anna' })
  })

  test('returns the date of birth in the detail view', async () => {
    const { asUser } = await setup()
    const { id } = await createPerson(asUser)

    const response = await asUser.get(id)

    expect(response.status).toBe(200)
    expect(response.body.dateOfBirth).toBe(adultBirthDate)
  })
})

describe('age rules', () => {
  test.each([
    ['exactly 13 today', birthDateFor(13, 0), 201],
    ['13 tomorrow (12 years 364 days)', birthDateFor(13, 1), 422],
    ['exactly 120 today', birthDateFor(120, 0), 201],
    ['121 today', birthDateFor(121, 0), 422],
    ['born tomorrow', birthDateFor(0, 1), 422],
    ['born in the far future', '2999-01-01', 422],
  ])('%s -> %i', async (_name, dateOfBirth, status) => {
    const { asUser } = await setup()

    const response = await asUser.create({ name: 'Test', dateOfBirth })

    expect(response.status).toBe(status)
    if (status === 422) {
      expect(response.body.code).toBe('PERSON_AGE_NOT_SUPPORTED')
      expect(JSON.stringify(response.body)).not.toContain(dateOfBirth)
    }
  })

  test.each([
    ['not a date', 'yesterday'],
    ['a non-existent day', '2021-02-30'],
    ['a date with time', '1990-05-17T00:00:00Z'],
  ])('rejects %s as a validation error', async (_name, dateOfBirth) => {
    const { asUser } = await setup()

    const response = await asUser.create({ name: 'Test', dateOfBirth })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
    expect(JSON.stringify(response.body)).not.toContain(dateOfBirth)
  })

  test.each([
    ['an empty name', { name: '   ' }],
    ['a name over 80 characters', { name: 'a'.repeat(81) }],
    ['a missing name', {}],
  ])('rejects %s', async (_name, override) => {
    const { asUser } = await setup()

    const response = await asUser.create({
      dateOfBirth: adultBirthDate,
      ...override,
    })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })

  test('keeps the previous date of birth when an edit is rejected', async () => {
    const { asUser } = await setup()
    const { id } = await createPerson(asUser)

    const rejected = await asUser.patch(id, {
      dateOfBirth: birthDateFor(12, 0),
    })
    const stored = await asUser.get(id)

    expect(rejected.status).toBe(422)
    expect(rejected.body.code).toBe('PERSON_AGE_NOT_SUPPORTED')
    expect(stored.body.dateOfBirth).toBe(adultBirthDate)
  })
})

describe('update', () => {
  test('changes the name and the date of birth', async () => {
    const { asUser } = await setup()
    const { id } = await createPerson(asUser)

    const response = await asUser.patch(id, {
      name: 'Boris',
      dateOfBirth: '1985-01-02',
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      name: 'Boris',
      dateOfBirth: '1985-01-02',
    })
  })

  test('changes only the field that was sent', async () => {
    const { asUser } = await setup()
    const { id } = await createPerson(asUser, 'Anna')

    const response = await asUser.patch(id, { name: 'Boris' })

    expect(response.body).toMatchObject({
      name: 'Boris',
      dateOfBirth: adultBirthDate,
    })
  })

  test('rejects an empty update', async () => {
    const { asUser } = await setup()
    const { id } = await createPerson(asUser)

    const response = await asUser.patch(id, {})

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })
})

describe('limits', () => {
  test('refuses a third active profile', async () => {
    const { asUser } = await setup()
    await createPerson(asUser, 'One')
    await createPerson(asUser, 'Two')

    const response = await asUser.create({
      name: 'Three',
      dateOfBirth: adultBirthDate,
    })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('PROFILE_LIMIT_REACHED')
  })

  test('does not count archived profiles', async () => {
    const { asUser } = await setup()
    const first = await createPerson(asUser, 'One')
    await createPerson(asUser, 'Two')
    await asUser.archive(first.id)

    const response = await asUser.create({
      name: 'Three',
      dateOfBirth: adultBirthDate,
    })

    expect(response.status).toBe(201)
  })

  test('does not count deleted profiles', async () => {
    const { asUser } = await setup()
    const first = await createPerson(asUser, 'One')
    await createPerson(asUser, 'Two')
    await asUser.remove(first.id)

    const response = await asUser.create({
      name: 'Three',
      dateOfBirth: adultBirthDate,
    })

    expect(response.status).toBe(201)
  })

  test('does not mix the limits of two accounts', async () => {
    const { asUser, asOtherUser } = await setup()
    await createPerson(asUser, 'One')
    await createPerson(asUser, 'Two')

    const response = await asOtherUser.create({
      name: 'Other',
      dateOfBirth: adultBirthDate,
    })

    expect(response.status).toBe(201)
  })

  test('lets only the limit through when profiles are created in parallel', async () => {
    const { asUser, prisma, user } = await setup()

    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        asUser.create({ name: `P${index}`, dateOfBirth: adultBirthDate }),
      ),
    )

    const statuses = responses.map(({ status }) => status).sort()
    expect(statuses).toEqual([201, 201, 409, 409, 409, 409])
    expect(
      await prisma.personProfile.count({
        where: { accountId: user.accountId },
      }),
    ).toBe(2)
  })

  test('refuses a restore that would exceed the limit', async () => {
    const { asUser } = await setup()
    const first = await createPerson(asUser, 'One')
    await createPerson(asUser, 'Two')
    await asUser.archive(first.id)
    await createPerson(asUser, 'Three')

    const response = await asUser.restore(first.id)

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('PROFILE_LIMIT_REACHED')
    expect((await asUser.get(first.id)).body.archivedAt).not.toBeNull()
  })

  test('lets only the free slots through when archived profiles are restored in parallel', async () => {
    const { asUser, prisma, user } = await setup()
    const first = await createPerson(asUser, 'One')
    const second = await createPerson(asUser, 'Two')
    await asUser.archive(first.id)
    await asUser.archive(second.id)
    await createPerson(asUser, 'Three')

    const responses = await Promise.all([
      asUser.restore(first.id),
      asUser.restore(second.id),
    ])

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409])
    expect(
      await prisma.personProfile.count({
        where: { accountId: user.accountId, archivedAt: null },
      }),
    ).toBe(2)
  })
})

describe('archive, restore and delete', () => {
  test('hides an archived profile from the default list and shows it by status', async () => {
    const { asUser } = await setup()
    const { id } = await createPerson(asUser)

    const archived = await asUser.archive(id)
    const active = await asUser.list()
    const onlyArchived = await asUser.list('?status=archived')
    const all = await asUser.list('?status=all')

    expect(archived.status).toBe(200)
    expect(archived.body.archivedAt).not.toBeNull()
    expect(active.body).toHaveLength(0)
    expect(onlyArchived.body).toHaveLength(1)
    expect(all.body).toHaveLength(1)
  })

  test('restores an archived profile', async () => {
    const { asUser } = await setup()
    const { id } = await createPerson(asUser)
    await asUser.archive(id)

    const response = await asUser.restore(id)

    expect(response.status).toBe(200)
    expect(response.body.archivedAt).toBeNull()
  })

  test('treats a repeated archive and restore as a no-op', async () => {
    const { asUser } = await setup()
    const { id } = await createPerson(asUser)

    const restoreActive = await asUser.restore(id)
    await asUser.archive(id)
    const archiveAgain = await asUser.archive(id)

    expect(restoreActive.status).toBe(200)
    expect(archiveAgain.status).toBe(200)
  })

  test('deletes a profile permanently, including the date of birth', async () => {
    const { asUser, prisma } = await setup()
    const { id } = await createPerson(asUser)

    const response = await asUser.remove(id)

    expect(response.status).toBe(204)
    expect((await asUser.get(id)).status).toBe(404)
    expect(await prisma.personProfile.count({ where: { id } })).toBe(0)
  })

  test('rejects a status filter it does not know', async () => {
    const { asUser } = await setup()

    const response = await asUser.list('?status=everything')

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
  })
})

describe('access control', () => {
  test('hides a profile of another account on every route', async () => {
    const { asUser, asOtherUser } = await setup()
    const { id } = await createPerson(asUser)

    const responses = await Promise.all([
      asOtherUser.get(id),
      asOtherUser.patch(id, { name: 'Hacked' }),
      asOtherUser.archive(id),
      asOtherUser.restore(id),
      asOtherUser.remove(id),
    ])

    expect(responses.map(({ status }) => status)).toEqual(Array(5).fill(404))
    expect(responses[0]?.body.code).toBe('PERSON_NOT_FOUND')
    expect((await asUser.get(id)).body).toMatchObject({
      name: 'Anna',
      archivedAt: null,
    })
  })

  test('does not list profiles of another account', async () => {
    const { asUser, asOtherUser } = await setup()
    await createPerson(asUser)

    const response = await asOtherUser.list('?status=all')

    expect(response.body).toEqual([])
  })

  test('answers 404 to an id that is not a uuid', async () => {
    const { asUser } = await setup()

    const response = await asUser.get('not-a-uuid')

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('PERSON_NOT_FOUND')
  })

  test('answers 401 to an anonymous request', async () => {
    const { server } = await setup()

    const response = await request(server).get('/api/v1/people')

    expect(response.status).toBe(401)
  })

  test('answers 403 CONSENT_REQUIRED before consents are recorded', async () => {
    const { server } = await setup()
    const newcomer = await createActor()

    const response = await request(server)
      .post('/api/v1/people')
      .set('Authorization', newcomer.authorization)
      .send({ name: 'Anna', dateOfBirth: adultBirthDate })

    expect(response.status).toBe(403)
    expect(response.body.code).toBe('CONSENT_REQUIRED')
  })
})

describe('lock wait', () => {
  test('answers 503 when the account lock is held too long', async () => {
    const { asUser, prisma, user } = await setup()
    let release: () => void = () => undefined
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const holder = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM account WHERE id = ${user.accountId}::uuid FOR NO KEY UPDATE`
        await held
      },
      { timeout: 30_000 },
    )
    await new Promise((resolve) => setTimeout(resolve, 500))

    const response = await asUser.create({
      name: 'Anna',
      dateOfBirth: adultBirthDate,
    })
    release()
    await holder

    expect(response.status).toBe(503)
    expect(response.body.code).toBe('SERVICE_BUSY')
    expect(
      await prisma.personProfile.count({
        where: { accountId: user.accountId },
      }),
    ).toBe(0)
  })
})
