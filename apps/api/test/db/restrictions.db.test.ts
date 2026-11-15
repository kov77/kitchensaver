import request from 'supertest'
import { describe, expect, test } from 'vitest'
import * as zod from 'zod'

import { PrismaService } from '../../src/prisma/prisma.service.js'
import { createConsentedActor } from '../support/factories.js'
import {
  createPeopleClient,
  type PeopleClient,
  type RestrictionKind,
} from '../support/people-client.js'
import { createTestApp } from '../support/test-app.js'

const idSchema = zod.object({ id: zod.string() })

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
    asUser,
    asOtherUser: createPeopleClient(server, otherUser),
    allergies: asUser.restrictions('allergies'),
    exclusions: asUser.restrictions('exclusions'),
    preferences: asUser.restrictions('preferences'),
  }
}

async function createPerson(api: PeopleClient, name = 'Anna') {
  const response = await api.create({ name, dateOfBirth: '1990-05-17' })
  expect(response.status).toBe(201)
  return idSchema.parse(response.body).id
}

describe('allergies', () => {
  test('stores a known allergen as resolved', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)

    const response = await allergies.add(personId, { allergenCode: 'PEANUT' })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      id: expect.any(String),
      allergenCode: 'PEANUT',
      customLabel: null,
      resolved: true,
      createdAt: expect.any(String),
    })
  })

  test('keeps an OTHER allergy and reports it as unresolved', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)

    const created = await allergies.add(personId, {
      allergenCode: 'OTHER',
      customLabel: '  Kiwi ',
    })
    const listed = await allergies.list(personId)

    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({
      allergenCode: 'OTHER',
      customLabel: 'Kiwi',
      resolved: false,
    })
    expect(listed.body).toHaveLength(1)
    expect(listed.body[0]).toMatchObject({ customLabel: 'Kiwi' })
  })

  test.each([
    ['OTHER without a label', { allergenCode: 'OTHER' }],
    ['OTHER with a blank label', { allergenCode: 'OTHER', customLabel: '  ' }],
    [
      'a label longer than 80 characters',
      { allergenCode: 'OTHER', customLabel: 'a'.repeat(81) },
    ],
    [
      'a label on a known allergen',
      { allergenCode: 'MILK', customLabel: 'goat milk' },
    ],
    ['an unknown code', { allergenCode: 'GLUTEN' }],
    ['an unknown field', { allergenCode: 'MILK', severity: 'high' }],
    ['no code', {}],
  ])('rejects %s', async (_name, body) => {
    const { asUser, allergies, prisma } = await setup()
    const personId = await createPerson(asUser)

    const response = await allergies.add(personId, body)

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
    expect(
      await prisma.personAllergy.count({
        where: { personProfileId: personId },
      }),
    ).toBe(0)
  })

  test('rejects a second allergy with the same code', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    await allergies.add(personId, { allergenCode: 'MILK' })

    const response = await allergies.add(personId, { allergenCode: 'MILK' })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('ALLERGY_ALREADY_EXISTS')
  })

  test('treats OTHER labels that normalize equally as one allergy', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    await allergies.add(personId, {
      allergenCode: 'OTHER',
      customLabel: 'Kiwi',
    })

    const same = await allergies.add(personId, {
      allergenCode: 'OTHER',
      customLabel: ' kiwi ',
    })
    const different = await allergies.add(personId, {
      allergenCode: 'OTHER',
      customLabel: 'Mango',
    })

    expect(same.status).toBe(409)
    expect(different.status).toBe(201)
  })

  test('lets two people of one account have the same allergy', async () => {
    const { asUser, allergies } = await setup()
    const first = await createPerson(asUser, 'Anna')
    const second = await createPerson(asUser, 'Ben')

    const responses = await Promise.all([
      allergies.add(first, { allergenCode: 'SESAME' }),
      allergies.add(second, { allergenCode: 'SESAME' }),
    ])

    expect(responses.map(({ status }) => status)).toEqual([201, 201])
  })

  test('creates one allergy when the same request arrives twice at once', async () => {
    const { asUser, allergies, prisma } = await setup()
    const personId = await createPerson(asUser)

    const responses = await Promise.all([
      allergies.add(personId, { allergenCode: 'EGG' }),
      allergies.add(personId, { allergenCode: 'EGG' }),
    ])

    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409])
    expect(
      await prisma.personAllergy.count({
        where: { personProfileId: personId },
      }),
    ).toBe(1)
  })

  test('changes the label of an OTHER allergy', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    const created = await allergies.add(personId, {
      allergenCode: 'OTHER',
      customLabel: 'Kiwi',
    })

    const response = await allergies.patch(
      personId,
      idSchema.parse(created.body).id,
      { customLabel: 'Mango' },
    )

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      customLabel: 'Mango',
      resolved: false,
    })
  })

  test('rejects a label that collides with another OTHER allergy', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    await allergies.add(personId, {
      allergenCode: 'OTHER',
      customLabel: 'Kiwi',
    })
    const mango = await allergies.add(personId, {
      allergenCode: 'OTHER',
      customLabel: 'Mango',
    })

    const response = await allergies.patch(
      personId,
      idSchema.parse(mango.body).id,
      { customLabel: 'KIWI' },
    )

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('ALLERGY_ALREADY_EXISTS')
  })

  test('does not give a label to a known allergen', async () => {
    const { asUser, allergies, prisma } = await setup()
    const personId = await createPerson(asUser)
    const created = await allergies.add(personId, { allergenCode: 'SOY' })

    const response = await allergies.patch(
      personId,
      idSchema.parse(created.body).id,
      { customLabel: 'edamame' },
    )

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('ALLERGY_LABEL_NOT_APPLICABLE')
    expect(
      await prisma.personAllergy.count({
        where: { personProfileId: personId, customLabel: null },
      }),
    ).toBe(1)
  })

  test('removes an allergy', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    const created = await allergies.add(personId, { allergenCode: 'FISH' })
    const allergyId = idSchema.parse(created.body).id

    const removed = await allergies.remove(personId, allergyId)
    const again = await allergies.remove(personId, allergyId)
    const listed = await allergies.list(personId)

    expect(removed.status).toBe(204)
    expect(again.status).toBe(404)
    expect(again.body.code).toBe('ALLERGY_NOT_FOUND')
    expect(listed.body).toEqual([])
  })

  test('accepts every allowed allergen code', async () => {
    const { asUser, allergies } = await setup()
    const personId = await createPerson(asUser)
    const codes = [
      'MILK',
      'EGG',
      'FISH',
      'CRUSTACEAN_SHELLFISH',
      'MOLLUSC',
      'TREE_NUT',
      'PEANUT',
      'WHEAT',
      'SOY',
      'SESAME',
      'MUSTARD',
      'SULPHITES',
    ]

    for (const allergenCode of codes) {
      const response = await allergies.add(personId, { allergenCode })
      expect(response.status).toBe(201)
    }
    const listed = await allergies.list(personId)

    expect(listed.body).toHaveLength(codes.length)
  })
})

describe('exclusions', () => {
  test('stores the name as typed (trimmed) and lists it', async () => {
    const { asUser, exclusions } = await setup()
    const personId = await createPerson(asUser)

    const created = await exclusions.add(personId, {
      ingredientName: '  Cilantro ',
    })
    const listed = await exclusions.list(personId)

    expect(created.status).toBe(201)
    expect(created.body).toEqual({
      id: expect.any(String),
      ingredientName: 'Cilantro',
      createdAt: expect.any(String),
    })
    expect(listed.body).toEqual([created.body])
  })

  test('rejects the same name written differently', async () => {
    const { asUser, exclusions } = await setup()
    const personId = await createPerson(asUser)
    await exclusions.add(personId, { ingredientName: 'Brazil nuts' })

    const response = await exclusions.add(personId, {
      ingredientName: ' brazil   NUTS',
    })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('EXCLUSION_ALREADY_EXISTS')
  })

  test.each([
    ['an empty name', { ingredientName: '' }],
    ['a blank name', { ingredientName: '   ' }],
    ['a name longer than 80 characters', { ingredientName: 'a'.repeat(81) }],
    ['a non-string name', { ingredientName: 5 }],
    ['a name with a NUL character', { ingredientName: 'a\u0000b' }],
    ['an unknown field', { ingredientName: 'kale', rating: 1 }],
  ])('rejects %s', async (_name, body) => {
    const { asUser, exclusions, prisma } = await setup()
    const personId = await createPerson(asUser)

    const response = await exclusions.add(personId, body)

    expect(response.status).toBe(422)
    expect(
      await prisma.personExclusion.count({
        where: { personProfileId: personId },
      }),
    ).toBe(0)
  })

  test('removes an exclusion', async () => {
    const { asUser, exclusions } = await setup()
    const personId = await createPerson(asUser)
    const created = await exclusions.add(personId, { ingredientName: 'kale' })
    const exclusionId = idSchema.parse(created.body).id

    const removed = await exclusions.remove(personId, exclusionId)
    const again = await exclusions.remove(personId, exclusionId)

    expect(removed.status).toBe(204)
    expect(again.status).toBe(404)
    expect(again.body.code).toBe('EXCLUSION_NOT_FOUND')
  })
})

describe('preferences', () => {
  test('stores a rating and changes it', async () => {
    const { asUser, preferences } = await setup()
    const personId = await createPerson(asUser)
    const created = await preferences.add(personId, {
      ingredientName: 'Broccoli',
      rating: 2,
    })

    const changed = await preferences.patch(
      personId,
      idSchema.parse(created.body).id,
      { rating: 5 },
    )
    const listed = await preferences.list(personId)

    expect(created.status).toBe(201)
    expect(changed.status).toBe(200)
    expect(changed.body).toMatchObject({
      ingredientName: 'Broccoli',
      rating: 5,
    })
    expect(listed.body).toHaveLength(1)
    expect(listed.body[0]).toMatchObject({ rating: 5 })
  })

  test.each([1, 5])('accepts the boundary rating %i', async (rating) => {
    const { asUser, preferences } = await setup()
    const personId = await createPerson(asUser)

    const response = await preferences.add(personId, {
      ingredientName: 'beans',
      rating,
    })

    expect(response.status).toBe(201)
  })

  test.each([
    ['0', 0],
    ['6', 6],
    ['2.5', 2.5],
    ['-1', -1],
    ['a string', '3'],
  ])('rejects the rating %s', async (_name, rating) => {
    const { asUser, preferences, prisma } = await setup()
    const personId = await createPerson(asUser)

    const created = await preferences.add(personId, {
      ingredientName: 'beans',
      rating,
    })

    expect(created.status).toBe(422)
    expect(
      await prisma.personFoodPreference.count({
        where: { personProfileId: personId },
      }),
    ).toBe(0)
  })

  test('rejects an invalid rating on update and keeps the old one', async () => {
    const { asUser, preferences } = await setup()
    const personId = await createPerson(asUser)
    const created = await preferences.add(personId, {
      ingredientName: 'beans',
      rating: 3,
    })
    const preferenceId = idSchema.parse(created.body).id

    const response = await preferences.patch(personId, preferenceId, {
      rating: 9,
    })
    const listed = await preferences.list(personId)

    expect(response.status).toBe(422)
    expect(listed.body[0]).toMatchObject({ rating: 3 })
  })

  test('rejects a second rating for the same normalized name', async () => {
    const { asUser, preferences } = await setup()
    const personId = await createPerson(asUser)
    await preferences.add(personId, { ingredientName: 'Beans', rating: 3 })

    const response = await preferences.add(personId, {
      ingredientName: ' beans ',
      rating: 5,
    })

    expect(response.status).toBe(409)
    expect(response.body.code).toBe('PREFERENCE_ALREADY_EXISTS')
  })

  test('allows a name to be both excluded and rated', async () => {
    const { asUser, exclusions, preferences } = await setup()
    const personId = await createPerson(asUser)

    const excluded = await exclusions.add(personId, { ingredientName: 'beans' })
    const rated = await preferences.add(personId, {
      ingredientName: 'beans',
      rating: 1,
    })

    expect([excluded.status, rated.status]).toEqual([201, 201])
  })

  test('removes a preference', async () => {
    const { asUser, preferences } = await setup()
    const personId = await createPerson(asUser)
    const created = await preferences.add(personId, {
      ingredientName: 'beans',
      rating: 4,
    })
    const preferenceId = idSchema.parse(created.body).id

    const removed = await preferences.remove(personId, preferenceId)
    const again = await preferences.patch(personId, preferenceId, { rating: 2 })

    expect(removed.status).toBe(204)
    expect(again.status).toBe(404)
    expect(again.body.code).toBe('PREFERENCE_NOT_FOUND')
  })
})

const kinds: {
  kind: RestrictionKind
  body: object
  patchBody?: object
  notFoundCode: string
  countRows: (prisma: PrismaService, personProfileId: string) => Promise<number>
}[] = [
  {
    kind: 'allergies',
    body: { allergenCode: 'MILK' },
    patchBody: { customLabel: 'x' },
    notFoundCode: 'ALLERGY_NOT_FOUND',
    countRows: (prisma, personProfileId) =>
      prisma.personAllergy.count({ where: { personProfileId } }),
  },
  {
    kind: 'exclusions',
    body: { ingredientName: 'cilantro' },
    notFoundCode: 'EXCLUSION_NOT_FOUND',
    countRows: (prisma, personProfileId) =>
      prisma.personExclusion.count({ where: { personProfileId } }),
  },
  {
    kind: 'preferences',
    body: { ingredientName: 'cilantro', rating: 4 },
    patchBody: { rating: 2 },
    notFoundCode: 'PREFERENCE_NOT_FOUND',
    countRows: (prisma, personProfileId) =>
      prisma.personFoodPreference.count({ where: { personProfileId } }),
  },
]

describe.each(kinds)('$kind: isolation and lifecycle', (current) => {
  const { kind, body, patchBody, notFoundCode, countRows } = current

  test('another account gets 404 for the profile on every route', async () => {
    const { asUser, asOtherUser } = await setup()
    const personId = await createPerson(asUser)
    const created = await asUser.restrictions(kind).add(personId, body)
    const itemId = idSchema.parse(created.body).id
    const foreign = asOtherUser.restrictions(kind)

    const responses = [
      await foreign.list(personId),
      await foreign.add(personId, body),
      await foreign.remove(personId, itemId),
    ]
    if (patchBody) {
      responses.push(await foreign.patch(personId, itemId, patchBody))
    }

    for (const response of responses) {
      expect(response.status).toBe(404)
      expect(response.body.code).toBe('PERSON_NOT_FOUND')
    }
    const own = await asUser.restrictions(kind).list(personId)
    expect(own.body).toHaveLength(1)
  })

  test('an item is not reachable through another profile of the same account', async () => {
    const { asUser } = await setup()
    const owner = await createPerson(asUser, 'Anna')
    const neighbour = await createPerson(asUser, 'Ben')
    const api = asUser.restrictions(kind)
    const created = await api.add(owner, body)
    const itemId = idSchema.parse(created.body).id

    const responses = [await api.remove(neighbour, itemId)]
    if (patchBody) {
      responses.push(await api.patch(neighbour, itemId, patchBody))
    }
    const stillThere = await api.list(owner)

    for (const response of responses) {
      expect(response.status).toBe(404)
      expect(response.body.code).toBe(notFoundCode)
    }
    expect(stillThere.body).toEqual([created.body])
  })

  test('an id that is not a UUID answers with the not-found code', async () => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser)

    const response = await asUser.restrictions(kind).remove(personId, 'abc')

    expect(response.status).toBe(404)
    expect(response.body.code).toBe(notFoundCode)
  })

  test('an anonymous caller gets 401', async () => {
    const { asUser, server } = await setup()
    const personId = await createPerson(asUser)

    const response = await request(server).get(
      `/api/v1/people/${personId}/${kind}`,
    )

    expect(response.status).toBe(401)
  })

  test('an archived profile can still be edited', async () => {
    const { asUser } = await setup()
    const personId = await createPerson(asUser)
    await asUser.archive(personId)

    const response = await asUser.restrictions(kind).add(personId, body)

    expect(response.status).toBe(201)
  })

  test('deleting the profile deletes its rows', async () => {
    const { asUser, prisma } = await setup()
    const personId = await createPerson(asUser)
    await asUser.restrictions(kind).add(personId, body)
    expect(await countRows(prisma, personId)).toBe(1)

    await asUser.remove(personId)

    expect(await countRows(prisma, personId)).toBe(0)
  })
})

describe('database constraints', () => {
  test('refuse a rating outside 1..5 even without the API', async () => {
    const { asUser, prisma } = await setup()
    const personProfileId = await createPerson(asUser)

    await expect(
      prisma.personFoodPreference.create({
        data: {
          personProfileId,
          ingredientName: 'beans',
          normalizedName: 'beans',
          rating: 6,
        },
      }),
    ).rejects.toThrow()
  })

  test('refuse an OTHER allergy without a label', async () => {
    const { asUser, prisma } = await setup()
    const personProfileId = await createPerson(asUser)

    await expect(
      prisma.personAllergy.create({
        data: { personProfileId, allergenCode: 'OTHER' },
      }),
    ).rejects.toThrow()
  })

  test('refuse a label on a known allergen', async () => {
    const { asUser, prisma } = await setup()
    const personProfileId = await createPerson(asUser)

    await expect(
      prisma.personAllergy.create({
        data: {
          personProfileId,
          allergenCode: 'MILK',
          customLabel: 'goat milk',
          normalizedLabel: 'goat milk',
        },
      }),
    ).rejects.toThrow()
  })
})
