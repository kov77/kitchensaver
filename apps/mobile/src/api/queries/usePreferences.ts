import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getPreferencesKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

export function usePreferences(personId: string) {
  return useQuery({
    queryKey: getPreferencesKey(personId),
    meta: { skipGlobalError: true },
    queryFn: async () =>
      unwrapResponse(
        await apiClient.GET('/api/v1/people/{id}/preferences', {
          params: { path: { id: personId } },
        }),
      ),
  })
}
