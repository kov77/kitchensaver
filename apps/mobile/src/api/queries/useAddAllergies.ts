import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { AllergyItem } from '@/core/types'

import { apiClient } from '../apiClient'
import { PEOPLE_QUERY_KEY } from '../constants'
import { assertResponseOk } from '../unwrapResponse'

export function useAddAllergies(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (items: AllergyItem[]) => {
      for (const item of items) {
        assertResponseOk(
          await apiClient.POST('/api/v1/people/{id}/allergies', {
            params: { path: { id: personId } },
            body: item,
          }),
        )
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY }),
  })
}
