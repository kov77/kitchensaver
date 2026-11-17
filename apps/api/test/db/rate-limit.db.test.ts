import request from 'supertest'
import { describe, expect, test } from 'vitest'

import {
  type RateLimits,
  DEFAULT_RATE_LIMITS,
} from '../../src/rate-limit/rate-limit.options.js'
import { PrismaService } from '../../src/prisma/prisma.service.js'
import { createConsentedActor } from '../support/factories.js'
import { createPeopleClient } from '../support/people-client.js'
import { createTestApp } from '../support/test-app.js'
import { createTestTokenVerifier } from '../support/test-auth.js'

async function setup(rateLimits: RateLimits) {
  const app = await createTestApp('test', createTestTokenVerifier(), rateLimits)
  const prisma = app.get(PrismaService)
  const server = app.getHttpServer()
  const user = await createConsentedActor(prisma)
  const otherUser = await createConsentedActor(prisma)
  return {
    server,
    user,
    otherUser,
    asUser: createPeopleClient(server, user),
    asOtherUser: createPeopleClient(server, otherUser),
    getMe: (authorization: string) =>
      request(server).get('/api/v1/me').set('Authorization', authorization),
  }
}

describe('account rate limit', () => {
  const LIMIT = 3
  const limits = { ...DEFAULT_RATE_LIMITS, requestsPerMinute: LIMIT }

  test('answers 429 once the account used its budget', async () => {
    const { user, getMe } = await setup(limits)
    for (let sent = 0; sent < LIMIT; sent++) {
      expect((await getMe(user.authorization)).status).toBe(200)
    }

    const response = await getMe(user.authorization)

    expect(response.status).toBe(429)
    expect(response.body).toEqual({
      code: 'RATE_LIMITED',
      message: expect.any(String),
      details: { retryAfterSeconds: expect.any(Number) },
      requestId: expect.any(String),
    })
    expect(response.body.details.retryAfterSeconds).toBeGreaterThan(0)
    expect(response.body.details.retryAfterSeconds).toBeLessThanOrEqual(60)
    expect(response.headers['retry-after']).toBe(
      String(response.body.details.retryAfterSeconds),
    )
  })

  test('counts every route of the account in one budget', async () => {
    const { asUser } = await setup(limits)
    for (let sent = 0; sent < LIMIT; sent++) await asUser.list()

    const response = await asUser.create({
      name: 'Anna',
      dateOfBirth: '1990-05-17',
    })

    expect(response.status).toBe(429)
    expect(response.body.code).toBe('RATE_LIMITED')
  })

  test('does not slow another account down', async () => {
    const { user, otherUser, getMe } = await setup(limits)
    for (let sent = 0; sent <= LIMIT; sent++) await getMe(user.authorization)

    const response = await getMe(otherUser.authorization)

    expect(response.status).toBe(200)
  })

  test('leaves unauthenticated requests at 401 and spends no budget', async () => {
    const { server, user, getMe } = await setup(limits)
    const statuses = []
    for (let sent = 0; sent <= LIMIT; sent++) {
      statuses.push((await request(server).get('/api/v1/me')).status)
    }

    const response = await getMe(user.authorization)

    expect(new Set(statuses)).toEqual(new Set([401]))
    expect(response.status).toBe(200)
  })

  test('never limits the health check', async () => {
    const { server } = await setup(limits)
    const statuses = []
    for (let sent = 0; sent <= LIMIT * 3; sent++) {
      statuses.push((await request(server).get('/health')).status)
    }

    expect(new Set(statuses)).toEqual(new Set([200]))
  })
})

describe('strict rate limit', () => {
  const STRICT_LIMIT = 2
  const limits = {
    requestsPerMinute: 50,
    strictRequestsPerMinute: STRICT_LIMIT,
  }
  const onboardingBody = {
    name: 'Anna',
    dateOfBirth: '1990-05-17',
    allergies: { status: 'NONE', warningAcknowledged: true },
  }

  async function onboardRepeatedly(
    asUser: Awaited<ReturnType<typeof setup>>['asUser'],
    times: number,
  ) {
    const responses = []
    for (let sent = 0; sent < times; sent++) {
      responses.push(
        await asUser.onboard(onboardingBody, `${sent}`.padStart(20, 'k')),
      )
    }
    return responses
  }

  test('limits onboarding of one account per route', async () => {
    const { asUser } = await setup(limits)

    const responses = await onboardRepeatedly(asUser, STRICT_LIMIT + 1)

    expect(
      responses.slice(0, STRICT_LIMIT).map(({ status }) => status),
    ).toEqual([201, 201])
    expect(responses[STRICT_LIMIT]?.status).toBe(429)
    expect(responses[STRICT_LIMIT]?.body.code).toBe('RATE_LIMITED')
  })

  test('does not affect another account', async () => {
    const { asUser, asOtherUser } = await setup(limits)
    await onboardRepeatedly(asUser, STRICT_LIMIT + 1)

    const [response] = await onboardRepeatedly(asOtherUser, 1)

    expect(response?.status).toBe(201)
  })

  test('keeps a separate budget per strict route', async () => {
    const { server, user, asUser } = await setup(limits)
    await onboardRepeatedly(asUser, STRICT_LIMIT + 1)

    const consent = await request(server)
      .post('/api/v1/me/consents')
      .set('Authorization', user.authorization)
      .send({})

    expect(consent.status).toBe(422)
  })

  test('limits consent recording per account', async () => {
    const { server, user } = await setup(limits)
    const statuses = []
    for (let sent = 0; sent <= STRICT_LIMIT; sent++) {
      const response = await request(server)
        .post('/api/v1/me/consents')
        .set('Authorization', user.authorization)
        .send({})
      statuses.push(response.status)
    }

    expect(statuses).toEqual([422, 422, 429])
  })

  test('applies a decorator placed on the controller class', async () => {
    const { server, user } = await setup(limits)
    const statuses = []
    for (let sent = 0; sent <= STRICT_LIMIT; sent++) {
      const response = await request(server)
        .get('/api/v1/probe-strict')
        .set('Authorization', user.authorization)
      statuses.push(response.status)
    }

    expect(statuses).toEqual([200, 200, 429])
  })

  test('leaves ordinary routes outside the strict budget', async () => {
    const { asUser, getMe, user } = await setup(limits)
    await onboardRepeatedly(asUser, STRICT_LIMIT + 1)

    const responses = []
    for (let sent = 0; sent <= STRICT_LIMIT; sent++) {
      responses.push(await getMe(user.authorization))
    }

    expect(new Set(responses.map(({ status }) => status))).toEqual(
      new Set([200]),
    )
  })
})
