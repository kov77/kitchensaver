import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { apiClient } from '@/api/apiClient'

import { useAppAccess } from './useAppAccess'

let mockSessionStatus: 'loading' | 'signedOut' | 'signedIn'

jest.mock('@/api/apiClient', () => ({
  apiClient: { GET: jest.fn() },
}))

jest.mock('./auth/SessionProvider', () => ({
  useSession: () => ({ state: { status: mockSessionStatus } }),
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

function respond(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) }
}

function serverState({
  isConsentComplete,
  people,
}: {
  isConsentComplete: boolean
  people: unknown[]
}) {
  jest.mocked(apiClient.GET).mockImplementation((async (path: string) =>
    path === '/api/v1/me'
      ? respond({
          id: 'account',
          onboarding: { complete: isConsentComplete },
        })
      : respond(people)) as never)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSessionStatus = 'signedIn'
})

describe('useAppAccess', () => {
  it('does not ask the server for anything while signed out', async () => {
    mockSessionStatus = 'signedOut'

    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    expect(result.current.access).toBe('signedOut')
    expect(apiClient.GET).not.toHaveBeenCalled()
  })

  it('requires consent before it looks at the profiles', async () => {
    serverState({ isConsentComplete: false, people: [] })

    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    await waitFor(() => expect(result.current.access).toBe('consentRequired'))
    expect(apiClient.GET).not.toHaveBeenCalledWith(
      '/api/v1/people',
      expect.anything(),
    )
  })

  it('asks for onboarding when the account has no profile', async () => {
    serverState({ isConsentComplete: true, people: [] })

    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    await waitFor(() =>
      expect(result.current.access).toBe('onboardingRequired'),
    )
  })

  it('opens the app when a profile exists', async () => {
    serverState({ isConsentComplete: true, people: [{ id: 'person' }] })

    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    await waitFor(() => expect(result.current.access).toBe('ready'))
  })

  it('stays unavailable after a failed load and recovers on retry', async () => {
    jest
      .mocked(apiClient.GET)
      .mockRejectedValueOnce(new TypeError('Network request failed'))
    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    await waitFor(() => expect(result.current.access).toBe('unavailable'))
    expect(result.current.errorMessage).toBe(
      'No connection. Check your internet and try again.',
    )

    serverState({ isConsentComplete: true, people: [{ id: 'person' }] })
    await act(async () => result.current.retry())

    await waitFor(() => expect(result.current.access).toBe('ready'))
  })

  it('does not open the app when the profiles cannot be loaded', async () => {
    jest.mocked(apiClient.GET).mockImplementation((async (path: string) => {
      if (path === '/api/v1/me') {
        return respond({ id: 'account', onboarding: { complete: true } })
      }
      throw new TypeError('Network request failed')
    }) as never)

    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    await waitFor(() => expect(result.current.access).toBe('unavailable'))
  })
})
