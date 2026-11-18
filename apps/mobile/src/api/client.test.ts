import { createApiClient } from './client'

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
