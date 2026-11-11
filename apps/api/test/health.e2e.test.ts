import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { createTestApp } from './support/test-app.js'

describe('GET /health', () => {
  test('responds 200 with status ok and needs no authentication', async () => {
    const app = await createTestApp()

    const response = await request(app.getHttpServer()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})
