import type { EstimateInput } from '@/core/types'

import { apiClient } from './apiClient'
import { unwrapResponse } from './unwrapResponse'

export async function requestGoalEstimate(
  personId: string,
  input: EstimateInput,
) {
  return unwrapResponse(
    await apiClient.POST('/api/v1/people/{id}/goals/estimate', {
      params: { path: { id: personId } },
      body: input,
    }),
  )
}

export async function requestGoalPreview(
  dateOfBirth: string,
  input: EstimateInput,
) {
  return unwrapResponse(
    await apiClient.POST('/api/v1/people/goals/estimate', {
      body: { dateOfBirth, ...input },
    }),
  )
}
