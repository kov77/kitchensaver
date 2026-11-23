import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getPreferencesKey } from '../queryKeys'
import { assertResponseOk } from '../unwrapResponse'

export function useDeletePreference(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (preferenceId: string) =>
      assertResponseOk(
        await apiClient.DELETE(
          '/api/v1/people/{id}/preferences/{preferenceId}',
          { params: { path: { id: personId, preferenceId } } },
        ),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: getPreferencesKey(personId) }),
  })
}
