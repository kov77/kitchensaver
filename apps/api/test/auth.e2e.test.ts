import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { TokenVerificationUnavailableError } from '../src/auth/token-verifier.js'
import { createTestApp } from './support/test-app.js'
import { createUnsignedTestToken, signTestToken } from './support/test-auth.js'

describe('authentication guard', () => {
  test('rejects a request without credentials', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer()).get('/api/v1/me')

    expect(response.status).toBe(401)
  })

  test.each([
    ['a non-bearer scheme', 'Basic dXNlcjpwYXNz'],
    ['an empty bearer token', 'Bearer '],
    ['a bearer header with extra parts', 'Bearer a b'],
    ['a malformed token', 'Bearer not-a-jwt'],
  ])('rejects %s', async (_name, authorization) => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', authorization)

    expect(response.status).toBe(401)
  })

  test('rejects an expired token', async () => {
    const app = await createTestApp()
    const token = await signTestToken({
      expiresAtSeconds: Math.floor(Date.now() / 1000) - 60,
    })

    const response = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(401)
  })

  test('rejects an unsigned token', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${createUnsignedTestToken('someone')}`)

    expect(response.status).toBe(401)
  })

  test('does not reveal why a token was rejected', async () => {
    const app = await createTestApp()
    const token = await signTestToken({
      expiresAtSeconds: Math.floor(Date.now() / 1000) - 60,
    })

    const { body } = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)

    expect(body).toEqual({ message: 'Unauthorized', statusCode: 401 })
  })

  test('answers 503, not 401, when tokens cannot be verified', async () => {
    const app = await createTestApp('test', {
      verify: () =>
        Promise.reject(new TokenVerificationUnavailableError('test_outage')),
    })
    const token = await signTestToken()

    const response = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(503)
    expect(JSON.stringify(response.body)).not.toContain('test_outage')
  })

  test('keeps the health endpoint public', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer()).get('/health')

    expect(response.status).toBe(200)
  })
})
