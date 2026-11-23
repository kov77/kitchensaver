import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { AnswerableAllergyStatus } from '@/core/types'

import { apiClient } from '../apiClient'
import { PEOPLE_QUERY_KEY } from '../constants'
import { unwrapResponse } from '../unwrapResponse'

export function useSetAllergyStatus(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (status: AnswerableAllergyStatus) =>
      unwrapResponse(
        await apiClient.PUT('/api/v1/people/{id}/allergy-status', {
          params: { path: { id: personId } },
          body: { status, warningAcknowledged: true },
        }),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY }),
  })
}
