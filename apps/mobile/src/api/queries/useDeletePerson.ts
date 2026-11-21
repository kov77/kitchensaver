import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { PEOPLE_LIST_QUERY_KEY } from '../constants'
import { getPersonKey } from '../queryKeys'
import { assertResponseOk } from '../unwrapResponse'

export function useDeletePerson(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async () =>
      assertResponseOk(
        await apiClient.DELETE('/api/v1/people/{id}', {
          params: { path: { id: personId } },
        }),
      ),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: getPersonKey(personId) })
      void queryClient.invalidateQueries({ queryKey: PEOPLE_LIST_QUERY_KEY })
    },
  })
}
