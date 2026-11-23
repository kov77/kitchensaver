import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Rating } from '@/core/types'

import { apiClient } from '../apiClient'
import { getPreferencesKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

type NewPreference = {
  ingredientName: string
  rating: Rating
}

export function useAddPreference(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (preference: NewPreference) =>
      unwrapResponse(
        await apiClient.POST('/api/v1/people/{id}/preferences', {
          params: { path: { id: personId } },
          body: preference,
        }),
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: getPreferencesKey(personId) }),
  })
}
