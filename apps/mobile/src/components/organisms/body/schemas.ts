import * as zod from 'zod'

import { GOAL_LIMITS } from '@/core/constants'
import { lazyMessage } from '@/utils/messages'
import { isNumberInRange } from '@/utils/numbers'
import { choice } from '@/utils/schemas'

import { ACTIVITY_LEVELS, FORMULA_SEXES } from './constants'

export const bodyFields = {
  heightCm: zod
    .string()
    .refine(
      (text) => isNumberInRange(text, GOAL_LIMITS.heightCm),
      lazyMessage('body:errors-height'),
    ),
  weightKg: zod
    .string()
    .refine(
      (text) => isNumberInRange(text, GOAL_LIMITS.weightKg),
      lazyMessage('body:errors-weight'),
    ),
  activityLevel: choice(ACTIVITY_LEVELS),
  formulaSex: choice(FORMULA_SEXES),
}

export const bodyParametersSchema = zod.object(bodyFields)

export type BodyParametersValues = zod.input<typeof bodyParametersSchema>
