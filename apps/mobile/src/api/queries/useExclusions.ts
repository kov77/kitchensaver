import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getExclusionsKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

export function useExclusions(personId: string) {
  return useQuery({
    queryKey: getExclusionsKey(personId),
    meta: { skipGlobalError: true },
    queryFn: async () =>
      unwrapResponse(
        await apiClient.GET('/api/v1/people/{id}/exclusions', {
          params: { path: { id: personId } },
        }),
      ),
  })
}
