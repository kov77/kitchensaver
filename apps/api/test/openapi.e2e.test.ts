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

  test('documents the goal and body parameter routes', async () => {
    const app = await createTestApp('development')

    const { body } = await request(app.getHttpServer()).get(
      `/${SWAGGER_PATH}-json`,
    )

    const { paths } = body
    expect(paths['/api/v1/people/{id}/goal'].get).toBeDefined()
    expect(paths['/api/v1/people/{id}/goal'].put.requestBody).toBeDefined()
    expect(paths['/api/v1/people/{id}/goals/estimate'].post).toBeDefined()
    expect(paths['/api/v1/people/{id}/body-parameters'].delete).toBeDefined()
    const { schema } =
      paths['/api/v1/people/{id}/goals/estimate'].post.requestBody.content[
        'application/json'
      ]
    expect(schema.properties.goalType.enum).toEqual([
      'LOSE',
      'MAINTAIN',
      'GAIN',
    ])
    expect(schema.required).toEqual(['goalType'])
  })

  test('documents the allergy, exclusion and preference routes', async () => {
    const app = await createTestApp('development')

    const { body } = await request(app.getHttpServer()).get(
      `/${SWAGGER_PATH}-json`,
    )

    const { paths } = body
    expect(
      paths['/api/v1/people/{id}/allergies'].post.requestBody,
    ).toBeDefined()
    expect(
      paths['/api/v1/people/{id}/allergies/{allergyId}'].patch,
    ).toBeDefined()
    expect(
      paths['/api/v1/people/{id}/exclusions/{exclusionId}'].delete,
    ).toBeDefined()
    expect(paths['/api/v1/people/{id}/preferences'].get).toBeDefined()
    const { schema } =
      paths['/api/v1/people/{id}/preferences'].post.requestBody.content[
        'application/json'
      ]
    expect(schema.required).toEqual(['ingredientName', 'rating'])
    expect(schema.properties.rating).toMatchObject({ minimum: 1, maximum: 5 })
  })

  test('documents onboarding with its required idempotency header', async () => {
    const app = await createTestApp('development')

    const { body } = await request(app.getHttpServer()).get(
      `/${SWAGGER_PATH}-json`,
    )

    const { paths } = body
    const { parameters, requestBody } = paths['/api/v1/people/onboarding'].post
    expect(parameters).toContainEqual(
      expect.objectContaining({
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
      }),
    )
    const { schema } = requestBody.content['application/json']
    expect(schema.required).toEqual(['name', 'dateOfBirth'])
    expect(schema.additionalProperties).toBe(false)
    const preview = paths['/api/v1/people/goals/estimate'].post
    expect(
      preview.requestBody.content['application/json'].schema.required,
    ).toEqual(expect.arrayContaining(['dateOfBirth', 'heightCm', 'goalType']))
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

  test('documents the people routes in sync with their validation', async () => {
    const app = await createTestApp('development')

    const { body } = await request(app.getHttpServer()).get(
      `/${SWAGGER_PATH}-json`,
    )

    const people = body.paths['/api/v1/people']
    expect(people.get.security).toEqual([{ bearer: [] }])
    expect(people.post.responses['201']).toBeDefined()
    expect(people.post.responses['409']).toBeDefined()
    expect(
      body.paths['/api/v1/people/{id}'].delete.responses['204'],
    ).toBeDefined()
    expect(body.paths['/api/v1/people/{id}/restore'].post).toBeDefined()
    const { schema } = people.post.requestBody.content['application/json']
    expect(schema.properties.name).toMatchObject({
      minLength: 1,
      maxLength: 80,
    })
    expect(schema.required).toEqual(['name', 'dateOfBirth'])
    expect(schema.additionalProperties).toBe(false)
    expect(
      people.get.parameters.find(
        ({ name }: { name: string }) => name === 'status',
      ).schema.enum,
    ).toEqual(['active', 'archived', 'all'])
  })
})
