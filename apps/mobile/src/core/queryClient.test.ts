import { MutationObserver } from '@tanstack/react-query'

import { ApiRequestError, shouldRetryRequest } from '@/utils/errors'

import { queryClient } from './queryClient'
import { dismissToast, getToasts } from './toast/toastStore'

const mockSignOut = jest.fn()

jest.mock('./auth/supabase', () => ({
  supabase: {
    auth: {
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}))

function toastMessages() {
  return getToasts().map(({ message }) => message)
}

function failingQuery(error: Error, meta?: Record<string, unknown>) {
  return queryClient
    .fetchQuery({
      queryKey: ['failing', Math.random()],
      queryFn: () => Promise.reject(error),
      retry: false,
      meta,
    })
    .catch(() => undefined)
}

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  queryClient.clear()
  getToasts().forEach(({ id }) => dismissToast(id))
})

describe('queryClient', () => {
  it('uses the shared retry rule for queries', () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(
      shouldRetryRequest,
    )
  })

  it('reports a failed query once through the global handler', async () => {
    await failingQuery(new ApiRequestError(503))

    expect(toastMessages()).toEqual([
      'The server had a problem. Please try again.',
    ])
  })

  it('signs out when a query is rejected with a 401', async () => {
    await failingQuery(new ApiRequestError(401))

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('shows no toast for a query that opts out', async () => {
    await failingQuery(new ApiRequestError(503), { skipGlobalError: true })

    expect(toastMessages()).toEqual([])
  })

  it('reports a failed mutation through the global handler', async () => {
    const observer = new MutationObserver(queryClient, {
      mutationFn: () => Promise.reject(new ApiRequestError(500)),
    })

    await observer.mutate(undefined).catch(() => undefined)

    expect(toastMessages()).toEqual([
      'The server had a problem. Please try again.',
    ])
  })

  it('leaves a mutation with its own error handler alone', async () => {
    const onError = jest.fn()
    const observer = new MutationObserver(queryClient, {
      mutationFn: () => Promise.reject(new ApiRequestError(500)),
      onError,
    })

    await observer.mutate(undefined).catch(() => undefined)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(toastMessages()).toEqual([])
  })
})
