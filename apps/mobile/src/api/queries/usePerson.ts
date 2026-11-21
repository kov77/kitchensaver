import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getPersonKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

export function usePerson(personId: string) {
  return useQuery({
    queryKey: getPersonKey(personId),
    meta: { skipGlobalError: true },
    queryFn: async () =>
      unwrapResponse(
        await apiClient.GET('/api/v1/people/{id}', {
          params: { path: { id: personId } },
        }),
      ),
  })
}
