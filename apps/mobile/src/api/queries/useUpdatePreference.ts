import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Rating } from '@/core/types'

import { apiClient } from '../apiClient'
import { getPreferencesKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

type RatingChange = {
  preferenceId: string
  rating: Rating
}

export function useUpdatePreference(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async ({ preferenceId, rating }: RatingChange) =>
      unwrapResponse(
        await apiClient.PATCH(
          '/api/v1/people/{id}/preferences/{preferenceId}',
          {
            params: { path: { id: personId, preferenceId } },
            body: { rating },
          },
        ),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: getPreferencesKey(personId) }),
  })
}
