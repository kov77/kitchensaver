import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { createTestApp } from './support/test-app.js'

describe('security headers', () => {
  test.each(['production', 'development'] as const)(
    'hide the framework and protect the response in %s',
    async (nodeEnv) => {
      const app = await createTestApp(nodeEnv)

      const response = await request(app.getHttpServer()).get('/health')

      expect(response.headers['x-powered-by']).toBeUndefined()
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['strict-transport-security']).toBeDefined()
      expect(response.headers['x-frame-options']).toBeDefined()
    },
  )

  test('keep the content security policy in production', async () => {
    const app = await createTestApp('production')

    const response = await request(app.getHttpServer()).get('/health')

    expect(response.headers['content-security-policy']).toContain(
      "default-src 'self'",
    )
  })

  test('relax the content security policy where the Swagger UI is served', async () => {
    const app = await createTestApp('development')

    const response = await request(app.getHttpServer()).get('/health')

    expect(response.headers['content-security-policy']).toBeUndefined()
  })
})
