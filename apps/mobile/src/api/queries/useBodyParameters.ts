import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { isBodyParametersNotFound } from '../bodyParameters'
import { getBodyParametersKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

export function useBodyParameters(personId: string) {
  return useQuery({
    queryKey: getBodyParametersKey(personId),
    meta: { skipGlobalError: true },
    queryFn: async () => {
      const result = await apiClient.GET(
        '/api/v1/people/{id}/body-parameters',
        { params: { path: { id: personId } } },
      )
      return isBodyParametersNotFound(result) ? null : unwrapResponse(result)
    },
  })
}
