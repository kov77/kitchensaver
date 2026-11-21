import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getAllergiesKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

export function useAllergies(personId: string) {
  return useQuery({
    queryKey: getAllergiesKey(personId),
    meta: { skipGlobalError: true },
    queryFn: async () =>
      unwrapResponse(
        await apiClient.GET('/api/v1/people/{id}/allergies', {
          params: { path: { id: personId } },
        }),
      ),
  })
}
