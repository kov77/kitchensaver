import createClient, { type Middleware } from 'openapi-fetch'

import type { paths } from './generated/schema'

type ApiClientOptions = {
  baseUrl: string
  getAccessToken: () => Promise<string | null>
}

export function createApiClient({ baseUrl, getAccessToken }: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl })

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      const accessToken = await getAccessToken()
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`)
      }
      return request
    },
  }
  client.use(authMiddleware)

  return client
}

export type ApiClient = ReturnType<typeof createApiClient>
