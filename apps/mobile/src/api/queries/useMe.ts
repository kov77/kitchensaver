import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { ApiRequestError } from '@/utils/errors'

import { ME_QUERY_KEY } from '../constants'

type UseMeOptions = {
  skipGlobalError?: boolean
}

export function useMe({ skipGlobalError = false }: UseMeOptions = {}) {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    meta: { skipGlobalError },
    queryFn: async () => {
      const { data, response } = await apiClient.GET('/api/v1/me')
      if (!data) throw new ApiRequestError(response.status)
      return data
    },
  })
}
