import * as zod from 'zod'

import { NAME_MAX_LENGTH, RATING_LIMITS } from '@/core/constants'
import { lazyMessage } from '@/utils/messages'
import { requiredText } from '@/utils/schemas'

const foodNameSchema = requiredText.max(
  NAME_MAX_LENGTH,
  lazyMessage('food:errors-name-too-long', { max: NAME_MAX_LENGTH }),
)

export const exclusionSchema = zod.object({ ingredientName: foodNameSchema })

export const preferenceSchema = zod.object({
  ingredientName: foodNameSchema,
  rating: zod.number().int().min(RATING_LIMITS.min).max(RATING_LIMITS.max),
})

export type ExclusionValues = zod.infer<typeof exclusionSchema>

export type PreferenceValues = zod.infer<typeof preferenceSchema>
