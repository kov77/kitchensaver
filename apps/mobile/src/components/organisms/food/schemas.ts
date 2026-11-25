import * as zod from 'zod'

import { NAME_MAX_LENGTH } from '@/core/constants'
import { lazyMessage } from '@/utils/messages'
import { requiredText } from '@/utils/schemas'

import { RATING_CHOICES } from './constants'

const foodNameSchema = requiredText.max(
  NAME_MAX_LENGTH,
  lazyMessage('food:errors-name-too-long', { max: NAME_MAX_LENGTH }),
)

export const exclusionSchema = zod.object({ ingredientName: foodNameSchema })

export const preferenceSchema = zod.object({
  ingredientName: foodNameSchema,
  rating: zod
    .custom<string | null>(
      (input) => input === null || RATING_CHOICES.includes(String(input)),
    )
    .refine(
      (value) => value !== null,
      lazyMessage('food:errors-rating-required'),
    ),
})

export type ExclusionValues = zod.infer<typeof exclusionSchema>

export type PreferenceValues = zod.input<typeof preferenceSchema>
