import request from 'supertest'
import { describe, expect, test } from 'vitest'

import { SWAGGER_PATH } from '../src/openapi/swagger.js'
import { createTestApp } from './support/test-app.js'

describe('OpenAPI documentation', () => {
  test('serves the OpenAPI document outside production', async () => {
    const app = await createTestApp('development')

    const { status, body } = await request(app.getHttpServer()).get(
      `/${SWAGGER_PATH}-json`,
    )

    expect(status).toBe(200)
    expect(body.openapi).toMatch(/^3\./)
    expect(body.info.title).toBe('KitchenSaver API')
    expect(body.paths['/health'].get.tags).toEqual(['health'])
    expect(
      body.paths['/health'].get.responses['200'].content['application/json']
        .schema.$ref,
    ).toBe('#/components/schemas/HealthResponseDto')
  })

  test('documents the protected /api/v1/me route with bearer auth', async () => {
    const app = await createTestApp('development')

    const { body } = await request(app.getHttpServer()).get(
      `/${SWAGGER_PATH}-json`,
    )

    expect(body.paths['/api/v1/me'].get.security).toEqual([{ bearer: [] }])
    expect(body.paths['/api/v1/me'].get.responses['401']).toBeDefined()
    expect(body.paths['/health'].get.security).toBeUndefined()
  })

  test('serves the Swagger UI outside production', async () => {
    const app = await createTestApp('development')

    const { status } = await request(app.getHttpServer()).get(
      `/${SWAGGER_PATH}`,
    )

    expect(status).toBe(200)
  })

  test('does not expose the documentation in production', async () => {
    const app = await createTestApp('production')

    const ui = await request(app.getHttpServer()).get(`/${SWAGGER_PATH}`)
    const json = await request(app.getHttpServer()).get(`/${SWAGGER_PATH}-json`)

    expect(ui.status).toBe(404)
    expect(json.status).toBe(404)
  })
})
