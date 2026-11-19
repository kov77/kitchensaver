import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@/utils/errors'

import { apiClient } from '../apiClient'
import { PEOPLE_QUERY_KEY } from '../constants'
import type { OnboardingBody, PersonListItem } from '../types'

type CreateOnboardingInput = {
  body: OnboardingBody
  idempotencyKey: string
}

export function useCreateOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async ({ body, idempotencyKey }: CreateOnboardingInput) => {
      const { data, response } = await apiClient.POST(
        '/api/v1/people/onboarding',
        { body, params: { header: { 'Idempotency-Key': idempotencyKey } } },
      )
      if (!data) throw new ApiRequestError(response.status)
      return data
    },
    onSuccess: ({ person }) => {
      queryClient.setQueryData<PersonListItem[]>(
        [...PEOPLE_QUERY_KEY, 'all'],
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
