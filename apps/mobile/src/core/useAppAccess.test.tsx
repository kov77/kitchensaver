import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

import { apiClient } from '@/api/apiClient'

import { ERROR_MESSAGES } from './constants'
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

function respondWithMe(isConsentComplete: boolean) {
  jest.mocked(apiClient.GET).mockResolvedValue({
    data: { id: 'account', onboarding: { complete: isConsentComplete } },
    response: new Response(null, { status: 200 }),
  } as never)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSessionStatus = 'signedIn'
})

describe('useAppAccess', () => {
  it('does not ask the server for the account while signed out', async () => {
    mockSessionStatus = 'signedOut'

    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    expect(result.current.access).toBe('signedOut')
    expect(apiClient.GET).not.toHaveBeenCalled()
  })

  it('requires consent when the server says it is missing', async () => {
    respondWithMe(false)

    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    await waitFor(() => expect(result.current.access).toBe('consentRequired'))
  })

  it('stays unavailable after a failed load and recovers on retry', async () => {
    jest
      .mocked(apiClient.GET)
      .mockRejectedValueOnce(new TypeError('Network request failed'))
    const { result } = await renderHook(() => useAppAccess(), { wrapper })

    await waitFor(() => expect(result.current.access).toBe('unavailable'))
    expect(result.current.errorMessage).toBe(ERROR_MESSAGES.NETWORK)

    respondWithMe(true)
    await act(async () => result.current.retry())

    await waitFor(() => expect(result.current.access).toBe('ready'))
  })
})
