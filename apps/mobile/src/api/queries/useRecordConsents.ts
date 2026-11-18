import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@/utils/errors'

import { apiClient } from '../apiClient'
import { ME_QUERY_KEY } from '../constants'
import type { Me, RecordConsentsBody } from '../types'

export function useRecordConsents() {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { skipGlobalError: true },
    mutationFn: async (body: RecordConsentsBody) => {
      const { data, response } = await apiClient.POST('/api/v1/me/consents', {
        body,
      })
      if (!data) throw new ApiRequestError(response.status)
      return data
    },
    onSuccess: (onboarding) => {
      queryClient.setQueryData<Me>(ME_QUERY_KEY, (me) =>
        me ? { ...me, onboarding } : me,
      )
    },
    onSettled: (_data, error) => {
      if (error) void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
    },
  })
}
