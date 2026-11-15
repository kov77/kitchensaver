import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { createTestApp } from './support/test-app.js'

describe('consent guard without a database', () => {
  test('answers 401, not 403, to an anonymous request', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer()).get('/api/v1/probe')

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('UNAUTHORIZED')
  })

  test('lets a @Public route through without a token', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer()).get(
      '/api/v1/probe/public',
    )

    expect(response.status).toBe(200)
  })
})
