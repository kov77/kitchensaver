import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { isBodyParametersNotFound } from '../bodyParameters'
import { getBodyParametersKey } from '../queryKeys'
import { assertResponseOk } from '../unwrapResponse'

export function useDeleteBodyParameters(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async () => {
      const result = await apiClient.DELETE(
        '/api/v1/people/{id}/body-parameters',
        { params: { path: { id: personId } } },
      )
      if (!isBodyParametersNotFound(result)) assertResponseOk(result)
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: getBodyParametersKey(personId),
      }),
  })
}
