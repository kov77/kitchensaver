import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { shouldRetryRequest } from '@/utils/errors'

import { handleError } from './errorHandler'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetryRequest },
  },
  queryCache: new QueryCache({
    onError: (error, { meta }) => handleError(error, meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, { meta, options }) => {
      if (options.onError) return
      handleError(error, meta)
    },
  }),
})
