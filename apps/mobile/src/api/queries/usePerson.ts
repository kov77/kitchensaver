import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getPersonKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

type UsePersonOptions = {
  personId: string
  enabled?: boolean
}

export function usePerson({ personId, enabled = true }: UsePersonOptions) {
  return useQuery({
    queryKey: getPersonKey(personId),
    meta: { skipGlobalError: true },
    enabled,
    queryFn: async () =>
      unwrapResponse(
        await apiClient.GET('/api/v1/people/{id}', {
          params: { path: { id: personId } },
        }),
      ),
  })
}
