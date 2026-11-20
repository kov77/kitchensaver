import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getPeopleListKey } from '../queryKeys'
import type { PeopleStatus } from '../types'
import { unwrapResponse } from '../unwrapResponse'

type UsePeopleOptions = {
  status: PeopleStatus
  enabled?: boolean
}

export function usePeople({ status, enabled = true }: UsePeopleOptions) {
  return useQuery({
    queryKey: getPeopleListKey(status),
    meta: { skipGlobalError: true },
    enabled,
    queryFn: async () =>
      unwrapResponse(
        await apiClient.GET('/api/v1/people', {
          params: { query: { status } },
        }),
      ),
  })
}
