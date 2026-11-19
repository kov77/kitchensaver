import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { GoalDraft } from '@/core/types'
import { ApiRequestError } from '@/utils/errors'
import { toSaveGoalBody } from '@/utils/goal'

import { apiClient } from '../apiClient'
import { PEOPLE_QUERY_KEY } from '../constants'

export function useSaveGoal(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (draft: GoalDraft) => {
      const { data, response } = await apiClient.PUT(
        '/api/v1/people/{id}/goal',
        { params: { path: { id: personId } }, body: toSaveGoalBody(draft) },
      )
      if (!data) throw new ApiRequestError(response.status)
      return data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY }),
  })
}
