import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { GoalDraft } from '@/core/types'
import { toSaveGoalBody } from '@/utils/goal'

import { apiClient } from '../apiClient'
import { PEOPLE_QUERY_KEY } from '../constants'
import { unwrapResponse } from '../unwrapResponse'

export function useSaveGoal(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (draft: GoalDraft) =>
      unwrapResponse(
        await apiClient.PUT('/api/v1/people/{id}/goal', {
          params: { path: { id: personId } },
          body: toSaveGoalBody(draft),
        }),
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY }),
  })
}
