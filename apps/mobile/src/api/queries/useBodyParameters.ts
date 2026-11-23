import { useQuery } from '@tanstack/react-query'

import { RESPONSE_STATUS_CODE } from '@/core/constants'

import { apiClient } from '../apiClient'
import { BODY_PARAMETERS_NOT_FOUND_CODE } from '../constants'
import { getBodyParametersKey } from '../queryKeys'
import { hasErrorCode, unwrapResponse } from '../unwrapResponse'

export function useBodyParameters(personId: string) {
  return useQuery({
    queryKey: getBodyParametersKey(personId),
    meta: { skipGlobalError: true },
    queryFn: async () => {
      const result = await apiClient.GET(
        '/api/v1/people/{id}/body-parameters',
        { params: { path: { id: personId } } },
      )
      const isNotSaved =
        result.response.status === RESPONSE_STATUS_CODE.NOT_FOUND &&
        hasErrorCode(result, BODY_PARAMETERS_NOT_FOUND_CODE)
      return isNotSaved ? null : unwrapResponse(result)
    },
  })
}
