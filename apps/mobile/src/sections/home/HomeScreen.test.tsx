import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, userEvent } from '@testing-library/react-native'

import { apiClient } from '@/api/apiClient'
import { ERROR_MESSAGES } from '@/core/constants'
import { shouldRetryRequest } from '@/utils/errors'

import { HomeScreen } from './HomeScreen'

const mockSignOut = jest.fn()

jest.mock('@/api/apiClient', () => ({
  apiClient: { GET: jest.fn() },
}))

jest.mock('@/core/auth/SessionProvider', () => ({
  useSession: () => ({ signOut: mockSignOut }),
}))

const ACCOUNT_ID = '0f8fad5b-d9cb-469f-a165-70867728950e'

function respondWith(status: number, data?: unknown) {
  jest.mocked(apiClient.GET).mockResolvedValue({
    data,
    response: new Response(null, { status }),
  } as never)
}

async function renderHome() {
  await render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: shouldRetryRequest } },
        })
      }
    >
      <HomeScreen />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('HomeScreen', () => {
  it('shows the account returned by the API', async () => {
    respondWith(200, { id: ACCOUNT_ID, onboarding: { complete: false } })

    await renderHome()

    expect(await screen.findByText(`Account: ${ACCOUNT_ID}`)).toBeTruthy()
    expect(screen.getByText('Consent: required')).toBeTruthy()
  })

  it('shows a plain message when the API rejects the token', async () => {
    respondWith(401)

    await renderHome()

    expect(await screen.findByText(ERROR_MESSAGES.SESSION_EXPIRED)).toBeTruthy()
  })

  it('shows a plain message for a missing account', async () => {
    respondWith(404)

    await renderHome()

    expect(await screen.findByText(ERROR_MESSAGES.NOT_FOUND)).toBeTruthy()
  })

  it('lets the user try again after an error', async () => {
    respondWith(404)
    await renderHome()
    await screen.findByText(ERROR_MESSAGES.NOT_FOUND)
    respondWith(200, { id: ACCOUNT_ID, onboarding: { complete: true } })

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Consent: complete')).toBeTruthy()
  })

  it('logs out on request', async () => {
    respondWith(200, { id: ACCOUNT_ID, onboarding: { complete: true } })
    await renderHome()
    await screen.findByText(`Account: ${ACCOUNT_ID}`)

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Log out' }))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
