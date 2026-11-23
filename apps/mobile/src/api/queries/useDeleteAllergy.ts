import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { PEOPLE_LIST_QUERY_KEY } from '../constants'
import { getAllergiesKey, getPersonKey } from '../queryKeys'
import { assertResponseOk } from '../unwrapResponse'

export function useDeleteAllergy(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (allergyId: string) =>
      assertResponseOk(
        await apiClient.DELETE('/api/v1/people/{id}/allergies/{allergyId}', {
          params: { path: { id: personId, allergyId } },
        }),
      ),
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: getPersonKey(personId),
        exact: true,
      })
      await queryClient.invalidateQueries({
        queryKey: getAllergiesKey(personId),
      })
      void queryClient.invalidateQueries({ queryKey: PEOPLE_LIST_QUERY_KEY })
    },
  })
}
