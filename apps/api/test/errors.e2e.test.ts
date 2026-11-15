import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { createTestApp } from './support/test-app.js'
import { signTestToken } from './support/test-auth.js'

describe('error responses', () => {
  test('use the shared shape with a server request id', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer()).get('/api/v1/unknown')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      code: 'NOT_FOUND',
      message: 'Not Found',
      requestId: expect.any(String),
    })
    expect(response.headers['x-request-id']).toBe(response.body.requestId)
  })

  test('ignore a request id sent by the client', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer())
      .get('/api/v1/unknown')
      .set('X-Request-Id', 'client-chosen-id')

    expect(response.body.requestId).not.toBe('client-chosen-id')
  })

  test('give every error its own request id', async () => {
    const app = await createTestApp()

    const first = await request(app.getHttpServer()).get('/api/v1/unknown')
    const second = await request(app.getHttpServer()).get('/api/v1/unknown')

    expect(first.body.requestId).not.toBe(second.body.requestId)
  })

  test('do not echo a malformed request body', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer())
      .post('/api/v1/me/consents')
      .set('Content-Type', 'application/json')
      .send('{"dateOfBirth": "1990-05-17" oops')

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('BAD_REQUEST')
    expect(JSON.stringify(response.body)).not.toContain('1990')
  })

  test('hide the message of an unexpected error', async () => {
    const app = await createTestApp()
    const token = await signTestToken()

    const response = await request(app.getHttpServer())
      .get('/api/v1/probe/boom')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(500)
    expect(response.body.code).toBe('INTERNAL_ERROR')
    expect(JSON.stringify(response.body)).not.toContain('secret-marker')
  })

  test('refuse a body parameter that has no validation schema', async () => {
    const app = await createTestApp()
    const token = await signTestToken()

    const response = await request(app.getHttpServer())
      .post('/api/v1/probe/unvalidated')
      .set('Authorization', `Bearer ${token}`)
      .send({ anything: true })

    expect(response.status).toBe(500)
  })
})
