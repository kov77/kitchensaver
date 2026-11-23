import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getExclusionsKey } from '../queryKeys'
import { assertResponseOk } from '../unwrapResponse'

export function useDeleteExclusion(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (exclusionId: string) =>
      assertResponseOk(
        await apiClient.DELETE('/api/v1/people/{id}/exclusions/{exclusionId}', {
          params: { path: { id: personId, exclusionId } },
        }),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: getExclusionsKey(personId) }),
  })
}
