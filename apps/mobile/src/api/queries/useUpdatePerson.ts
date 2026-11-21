import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toIsoDate } from '@/utils/dates'

import { apiClient } from '../apiClient'
import { PEOPLE_LIST_QUERY_KEY } from '../constants'
import { getPersonKey } from '../queryKeys'
import { unwrapResponse } from '../unwrapResponse'

type PersonChanges = {
  name: string
  dateOfBirth: Date
}

export function useUpdatePerson(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async ({ name, dateOfBirth }: PersonChanges) =>
      unwrapResponse(
        await apiClient.PATCH('/api/v1/people/{id}', {
          params: { path: { id: personId } },
          body: { name, dateOfBirth: toIsoDate(dateOfBirth) },
        }),
      ),
    onSuccess: (person) => {
      queryClient.setQueryData(getPersonKey(personId), person)
      return queryClient.invalidateQueries({ queryKey: PEOPLE_LIST_QUERY_KEY })
    },
  })
}
