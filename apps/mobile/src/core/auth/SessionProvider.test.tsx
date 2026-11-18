import { act, renderHook } from '@testing-library/react-native'
import { AuthApiError, type Session } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import { SessionProvider, useSession } from './SessionProvider'

type AuthStateCallback = (event: string, session: Session | null) => void

const mockAuth = {
  onAuthStateChange: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  startAutoRefresh: jest.fn(),
  stopAutoRefresh: jest.fn(),
}

jest.mock('./supabase', () => ({
  supabase: {
    get auth() {
      return mockAuth
    },
  },
}))

const SESSION = { access_token: 'access-token' } as Session

let emitAuthState: AuthStateCallback
let unsubscribe: jest.Mock
let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  queryClient = new QueryClient()
  unsubscribe = jest.fn()
  mockAuth.onAuthStateChange.mockImplementation((callback) => {
    emitAuthState = callback
    return { data: { subscription: { unsubscribe } } }
  })
})

describe('SessionProvider', () => {
  it('stays loading until the stored session is reported', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper })

    expect(result.current.state).toEqual({ status: 'loading' })
  })

  it('becomes signed in when a session is reported', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper })

    await act(async () => emitAuthState('INITIAL_SESSION', SESSION))

    expect(result.current.state).toEqual({
      status: 'signedIn',
      session: SESSION,
    })
  })

  it('becomes signed out when no session is stored', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper })

    await act(async () => emitAuthState('INITIAL_SESSION', null))

    expect(result.current.state).toEqual({ status: 'signedOut' })
  })

  it('clears every cached query when the user signs out', async () => {
    queryClient.setQueryData(['me'], { id: 'previous-user' })
    const { result } = await renderHook(() => useSession(), { wrapper })
    await act(async () => emitAuthState('SIGNED_IN', SESSION))

    await act(async () => emitAuthState('SIGNED_OUT', null))

    expect(result.current.state).toEqual({ status: 'signedOut' })
    expect(queryClient.getQueryData(['me'])).toBeUndefined()
  })

  it('keeps cached queries while the session is refreshed', async () => {
    queryClient.setQueryData(['me'], { id: 'current-user' })
    await renderHook(() => useSession(), { wrapper })

    await act(async () => emitAuthState('TOKEN_REFRESHED', SESSION))

    expect(queryClient.getQueryData(['me'])).toEqual({ id: 'current-user' })
  })

  it('stops listening and refreshing when it unmounts', async () => {
    const { unmount } = await renderHook(() => useSession(), { wrapper })

    await unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(mockAuth.stopAutoRefresh).toHaveBeenCalled()
  })

  describe('app state', () => {
    let changeAppState: (state: AppStateStatus) => void

    beforeEach(() => {
      jest
        .spyOn(AppState, 'addEventListener')
        .mockImplementation((_type, listener) => {
          changeAppState = listener
          return { remove: jest.fn() }
        })
    })

    it('stops refreshing in the background and resumes in the foreground', async () => {
      await renderHook(() => useSession(), { wrapper })
      mockAuth.startAutoRefresh.mockClear()
      mockAuth.stopAutoRefresh.mockClear()

      await act(async () => changeAppState('background'))
      expect(mockAuth.stopAutoRefresh).toHaveBeenCalledTimes(1)

      await act(async () => changeAppState('active'))
      expect(mockAuth.startAutoRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('signIn', () => {
    it('succeeds when Supabase accepts the credentials', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({ error: null })
      const { result } = await renderHook(() => useSession(), { wrapper })

      const outcome = await result.current.signIn({
        email: 'cook@example.com',
        password: 'correct-password',
      })

      expect(outcome).toEqual({ ok: true })
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'cook@example.com',
        password: 'correct-password',
      })
    })

    it('reports a mapped failure instead of the provider error', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        error: new AuthApiError('raw message', 400, 'invalid_credentials'),
      })
      const { result } = await renderHook(() => useSession(), { wrapper })

      const outcome = await result.current.signIn({
        email: 'cook@example.com',
        password: 'wrong-password',
      })

      expect(outcome).toEqual({ ok: false, failure: 'INVALID_CREDENTIALS' })
    })
  })

  describe('signUp', () => {
    it('reports that the email must be confirmed when no session is returned', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: {}, session: null },
        error: null,
      })
      const { result } = await renderHook(() => useSession(), { wrapper })

      const outcome = await result.current.signUp({
        email: 'new@example.com',
        password: 'long-enough-password',
      })

      expect(outcome).toEqual({ ok: true, emailConfirmationRequired: true })
    })

    it('does not ask for confirmation when a session is returned', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: {}, session: SESSION },
        error: null,
      })
      const { result } = await renderHook(() => useSession(), { wrapper })

      const outcome = await result.current.signUp({
        email: 'new@example.com',
        password: 'long-enough-password',
      })

      expect(outcome).toEqual({ ok: true, emailConfirmationRequired: false })
    })

    it('reports a mapped failure', async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new AuthApiError('raw', 422, 'weak_password'),
      })
      const { result } = await renderHook(() => useSession(), { wrapper })

      const outcome = await result.current.signUp({
        email: 'new@example.com',
        password: 'long-enough-password',
      })

      expect(outcome).toEqual({ ok: false, failure: 'WEAK_PASSWORD' })
    })
  })

  it('signs out through Supabase', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null })
    const { result } = await renderHook(() => useSession(), { wrapper })

    await result.current.signOut()

    expect(mockAuth.signOut).toHaveBeenCalledTimes(1)
  })
})
