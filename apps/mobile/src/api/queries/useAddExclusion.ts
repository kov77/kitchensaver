import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getExclusionsKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

export function useAddExclusion(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (ingredientName: string) =>
      unwrapResponse(
        await apiClient.POST('/api/v1/people/{id}/exclusions', {
          params: { path: { id: personId } },
          body: { ingredientName },
        }),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: getExclusionsKey(personId) }),
  })
}
