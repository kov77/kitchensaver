import * as zod from 'zod'

import { GOAL_LIMITS } from '@/core/constants'
import { lazyMessage } from '@/utils/messages'
import { isNumberInRange } from '@/utils/numbers'
import { choice, requiredText } from '@/utils/schemas'

import { ACTIVITY_LEVELS, FORMULA_SEXES } from './constants'

export const bodyFields = {
  heightCm: requiredText.refine(
    (text) => text === '' || isNumberInRange(text, GOAL_LIMITS.heightCm),
    lazyMessage('body:errors-height'),
  ),
  weightKg: requiredText.refine(
    (text) => text === '' || isNumberInRange(text, GOAL_LIMITS.weightKg),
    lazyMessage('body:errors-weight'),
  ),
  activityLevel: choice(ACTIVITY_LEVELS),
  formulaSex: choice(FORMULA_SEXES),
}

export const bodyParametersSchema = zod.object(bodyFields)

export type BodyParametersValues = zod.input<typeof bodyParametersSchema>
