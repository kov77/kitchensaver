import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { ME_QUERY_KEY } from '../constants'
import { unwrapResponse } from '../unwrapResponse'

type UseMeOptions = {
  skipGlobalError?: boolean
  enabled?: boolean
}

export function useMe({
  skipGlobalError = false,
  enabled = true,
}: UseMeOptions = {}) {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    enabled,
    meta: { skipGlobalError },
    queryFn: async () => unwrapResponse(await apiClient.GET('/api/v1/me')),
  })
}
