import { useQuery } from '@tanstack/react-query'

import { ApiRequestError } from '@/utils/errors'

import { apiClient } from '../apiClient'
import { PEOPLE_QUERY_KEY } from '../constants'

type PeopleStatus = 'active' | 'archived' | 'all'

type UsePeopleOptions = {
  status: PeopleStatus
  enabled?: boolean
}

export function usePeople({ status, enabled = true }: UsePeopleOptions) {
  return useQuery({
    queryKey: [...PEOPLE_QUERY_KEY, status],
    meta: { skipGlobalError: true },
    enabled,
    queryFn: async () => {
      const { data, response } = await apiClient.GET('/api/v1/people', {
        params: { query: { status } },
      })
      if (!data) throw new ApiRequestError(response.status)
      return data
    },
  })
}
