import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { BodyParameters } from '@/core/types'

import { apiClient } from '../apiClient'
import { getBodyParametersKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

export function useSaveBodyParameters(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (parameters: BodyParameters) =>
      unwrapResponse(
        await apiClient.PUT('/api/v1/people/{id}/body-parameters', {
          params: { path: { id: personId } },
          body: parameters,
        }),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: getBodyParametersKey(personId),
      }),
  })
}
