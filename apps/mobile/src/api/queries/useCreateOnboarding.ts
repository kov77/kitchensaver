import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '../apiClient'
import { PEOPLE_QUERY_KEY } from '../constants'
import { getPeopleListKey } from '../queryKeys'
import type { OnboardingBody, PersonListItem } from '../types'
import { unwrapResponse } from '../unwrapResponse'

type CreateOnboardingInput = {
  body: OnboardingBody
  idempotencyKey: string
}

export function useCreateOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async ({ body, idempotencyKey }: CreateOnboardingInput) =>
      unwrapResponse(
        await apiClient.POST('/api/v1/people/onboarding', {
          body,
          params: { header: { 'Idempotency-Key': idempotencyKey } },
        }),
      ),
    onSuccess: ({ person }) => {
      queryClient.setQueryData<PersonListItem[]>(
        getPeopleListKey('all'),
        (people = []) => [...people, person],
      )
      void queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY })
    },
    onSettled: (_data, error) => {
      if (error) {
        void queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY })
      }
    },
  })
}
