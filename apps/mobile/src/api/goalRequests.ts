import type { EstimateInput } from '@/core/types'
import { ApiRequestError } from '@/utils/errors'

import { apiClient } from './apiClient'

export async function requestGoalEstimate(
  personId: string,
  input: EstimateInput,
) {
  const { data, response } = await apiClient.POST(
    '/api/v1/people/{id}/goals/estimate',
    { params: { path: { id: personId } }, body: input },
  )
  if (!data) throw new ApiRequestError(response.status)
  return data
}

export async function requestGoalPreview(
  dateOfBirth: string,
  input: EstimateInput,
) {
  const { data, response } = await apiClient.POST(
    '/api/v1/people/goals/estimate',
    { body: { dateOfBirth, ...input } },
  )
  if (!data) throw new ApiRequestError(response.status)
  return data
}
