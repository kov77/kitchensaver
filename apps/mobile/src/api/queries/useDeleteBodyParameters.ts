import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { getBodyParametersKey } from '../queryKeys'
import { assertResponseOk } from '../unwrapResponse'

export function useDeleteBodyParameters(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async () =>
      assertResponseOk(
        await apiClient.DELETE('/api/v1/people/{id}/body-parameters', {
          params: { path: { id: personId } },
        }),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: getBodyParametersKey(personId),
      }),
  })
}
