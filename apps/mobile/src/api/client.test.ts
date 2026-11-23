import { ApiRequestError } from '@/utils/errors'

import { createApiClient } from './client'
import { assertResponseOk, unwrapResponse } from './unwrapResponse'

const BASE_URL = 'http://api.test'
const ME_RESPONSE = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  onboarding: {
    complete: false,
    missing: ['ADULT_ATTESTATION'],
    currentVersions: {
      adultAttestationVersion: '1',
      termsVersion: '1',
      privacyVersion: '1',
    },
  },
}

function mockFetch(status: number, body: unknown) {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => Response.json(body, { status }))
}

function lastRequest(fetchMock: ReturnType<typeof mockFetch>) {
  const [request] = fetchMock.mock.calls[0] ?? []
  if (!(request instanceof Request)) throw new Error('fetch got no Request')
  return request
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('createApiClient', () => {
  it('sends the access token as a bearer header', async () => {
    const fetchMock = mockFetch(200, ME_RESPONSE)
    const client = createApiClient({
      baseUrl: BASE_URL,
      getAccessToken: async () => 'access-token',
    })

    const { data } = await client.GET('/api/v1/me')

    const request = lastRequest(fetchMock)
    expect(request.url).toBe(`${BASE_URL}/api/v1/me`)
    expect(request.headers.get('Authorization')).toBe('Bearer access-token')
    expect(data?.id).toBe(ME_RESPONSE.id)
  })

  it('sends no authorization header without a token', async () => {
    const fetchMock = mockFetch(401, { code: 'UNAUTHORIZED' })
    const client = createApiClient({
      baseUrl: BASE_URL,
      getAccessToken: async () => null,
    })

    const { data, response } = await client.GET('/api/v1/me')

    expect(lastRequest(fetchMock).headers.has('Authorization')).toBe(false)
    expect(response.status).toBe(401)
    expect(data).toBeUndefined()
  })

  it('asks for the token on every request', async () => {
    mockFetch(200, ME_RESPONSE)
    const getAccessToken = jest.fn().mockResolvedValue('access-token')
    const client = createApiClient({ baseUrl: BASE_URL, getAccessToken })

    await client.GET('/api/v1/me')
    await client.GET('/api/v1/me')

    expect(getAccessToken).toHaveBeenCalledTimes(2)
  })
})

describe('errors from the real client', () => {
  const client = () =>
    createApiClient({ baseUrl: BASE_URL, getAccessToken: async () => null })
  const errorBody = {
    code: 'ALLERGY_ALREADY_EXISTS',
    message: 'Technical message',
    requestId: 'request-1',
  }

  it('keeps the error code of a failed request with data', async () => {
    mockFetch(409, errorBody)

    const result = await client().GET('/api/v1/me')

    expect(() => unwrapResponse(result)).toThrow(ApiRequestError)
    expect(() => unwrapResponse(result)).toThrow(
      expect.objectContaining({ status: 409, code: 'ALLERGY_ALREADY_EXISTS' }),
    )
  })

  it('accepts an empty successful response', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(null, { status: 204 }))

    const result = await client().DELETE('/api/v1/people/{id}', {
      params: { path: { id: 'person-1' } },
    })

    expect(() => assertResponseOk(result)).not.toThrow()
  })

  it('keeps the error code of a failed empty-bodied request', async () => {
    mockFetch(404, { ...errorBody, code: 'PERSON_NOT_FOUND' })

    const result = await client().DELETE('/api/v1/people/{id}', {
      params: { path: { id: 'person-1' } },
    })

    expect(() => assertResponseOk(result)).toThrow(
      expect.objectContaining({ status: 404, code: 'PERSON_NOT_FOUND' }),
    )
  })
})
