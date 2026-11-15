import request from 'supertest'
import { describe, expect, test } from 'vitest'

import {
  CONSENT_CATEGORIES,
  CURRENT_LEGAL_VERSIONS,
} from '../../src/consent/legal-versions.js'
import { PrismaService } from '../../src/prisma/prisma.service.js'
import { createAccount, createConsentedActor } from '../support/factories.js'
import { createTestApp } from '../support/test-app.js'
import { createActor, signTestToken } from '../support/test-auth.js'

const validBody = {
  adultConfirmed: true,
  acceptTerms: true,
  acknowledgePrivacy: true,
  termsVersion: CURRENT_LEGAL_VERSIONS.TERMS_OF_SERVICE,
  privacyVersion: CURRENT_LEGAL_VERSIONS.PRIVACY_POLICY,
}

async function setup() {
  const app = await createTestApp()
  const prisma = app.get(PrismaService)
  const user = await createActor()
  const server = app.getHttpServer()
  const accountId = async () =>
    (
      await prisma.account.findUniqueOrThrow({
        where: { externalAuthSubject: user.subject },
      })
    ).id
  const consentCount = async () =>
    prisma.accountConsent.count({ where: { accountId: await accountId() } })
  const post = (body: object) =>
    request(server)
      .post('/api/v1/me/consents')
      .set('Authorization', user.authorization)
      .send(body)
  const get = (path: string) =>
    request(server).get(path).set('Authorization', user.authorization)
  return { app, prisma, user, post, get, accountId, consentCount }
}

describe('onboarding status', () => {
  test('lists every missing confirmation for a new account', async () => {
    const { get } = await setup()

    const response = await get('/api/v1/me')

    expect(response.status).toBe(200)
    expect(response.body.onboarding).toEqual({
      complete: false,
      missing: CONSENT_CATEGORIES,
      currentVersions: {
        adultAttestationVersion: CURRENT_LEGAL_VERSIONS.ADULT_ATTESTATION,
        termsVersion: CURRENT_LEGAL_VERSIONS.TERMS_OF_SERVICE,
        privacyVersion: CURRENT_LEGAL_VERSIONS.PRIVACY_POLICY,
      },
    })
  })
})

describe('consent guard', () => {
  test('blocks a protected route until consents are recorded', async () => {
    const { get } = await setup()

    const response = await get('/api/v1/probe')

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({
      code: 'CONSENT_REQUIRED',
      details: { missing: CONSENT_CATEGORIES },
    })
  })

  test('lets a route marked @AllowWithoutConsent through', async () => {
    const { get } = await setup()

    const response = await get('/api/v1/probe/exempt')

    expect(response.status).toBe(200)
  })

  test('opens protected routes after consents are recorded', async () => {
    const { get, post } = await setup()

    await post(validBody)
    const response = await get('/api/v1/probe')

    expect(response.status).toBe(200)
  })

  test('does not depend on provider claims', async () => {
    const { prisma } = await setup()
    const account = await createAccount(prisma)
    const token = await signTestToken({ subject: account.externalAuthSubject })
    const app = await createTestApp()

    const response = await request(app.getHttpServer())
      .get('/api/v1/probe')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
  })

  test('accepts an account that already has current consents', async () => {
    const app = await createTestApp()
    const actor = await createConsentedActor(app.get(PrismaService))

    const response = await request(app.getHttpServer())
      .get('/api/v1/probe')
      .set('Authorization', actor.authorization)

    expect(response.status).toBe(200)
  })

  test('demands reconfirmation when a legal document version changed', async () => {
    const { prisma, get, post, accountId } = await setup()
    await get('/api/v1/me')
    const id = await accountId()
    await prisma.accountConsent.createMany({
      data: CONSENT_CATEGORIES.map((category) => ({
        accountId: id,
        category,
        documentVersion: 'old-version',
      })),
    })

    const blocked = await get('/api/v1/probe')
    await post(validBody)
    const allowed = await get('/api/v1/probe')

    expect(blocked.status).toBe(403)
    expect(allowed.status).toBe(200)
    expect(
      await prisma.accountConsent.count({ where: { accountId: id } }),
    ).toBe(6)
  })

  test('does not apply one account consents to another account', async () => {
    const { post } = await setup()
    const other = await createActor()
    const app = await createTestApp()
    await post(validBody)

    const response = await request(app.getHttpServer())
      .get('/api/v1/probe')
      .set('Authorization', other.authorization)

    expect(response.status).toBe(403)
  })
})

describe('POST /api/v1/me/consents', () => {
  test('records all three confirmations and reports a complete status', async () => {
    const { post, consentCount } = await setup()

    const response = await post(validBody)

    expect(response.status).toBe(200)
    expect(response.body.complete).toBe(true)
    expect(response.body.missing).toEqual([])
    expect(await consentCount()).toBe(3)
  })

  test('is idempotent', async () => {
    const { post, consentCount } = await setup()

    await post(validBody)
    const second = await post(validBody)

    expect(second.status).toBe(200)
    expect(await consentCount()).toBe(3)
  })

  test('creates a single set of rows for concurrent requests', async () => {
    const { post, consentCount } = await setup()

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => post(validBody)),
    )

    expect(responses.map(({ status }) => status)).toEqual(Array(5).fill(200))
    expect(await consentCount()).toBe(3)
  })

  test.each([
    ['adultConfirmed', 'ADULT_CONFIRMATION_REQUIRED'],
    ['acceptTerms', 'TERMS_NOT_ACCEPTED'],
    ['acknowledgePrivacy', 'PRIVACY_NOT_ACKNOWLEDGED'],
  ])('rejects %s=false and writes nothing', async (field, code) => {
    const { post, consentCount } = await setup()

    const response = await post({ ...validBody, [field]: false })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe(code)
    expect(await consentCount()).toBe(0)
  })

  test.each([['termsVersion'], ['privacyVersion']])(
    'rejects an outdated %s and writes nothing',
    async (field) => {
      const { post, consentCount } = await setup()

      const response = await post({ ...validBody, [field]: 'outdated' })

      expect(response.status).toBe(422)
      expect(response.body.code).toBe('LEGAL_VERSION_NOT_CURRENT')
      expect(await consentCount()).toBe(0)
    },
  )

  test('rejects a body without the required fields', async () => {
    const { post, consentCount } = await setup()

    const response = await post({ adultConfirmed: 'yes' })

    expect(response.status).toBe(422)
    expect(response.body.code).toBe('VALIDATION_FAILED')
    expect(response.body.details.fields).toEqual(
      expect.arrayContaining(['adultConfirmed', 'acceptTerms']),
    )
    expect(JSON.stringify(response.body)).not.toContain('yes')
    expect(await consentCount()).toBe(0)
  })

  test('requires authentication', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer())
      .post('/api/v1/me/consents')
      .send(validBody)

    expect(response.status).toBe(401)
  })
})
