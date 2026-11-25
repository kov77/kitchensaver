import * as zod from 'zod'

import { GOAL_LIMITS } from '@/core/constants'
import { lazyMessage } from '@/utils/messages'
import { isNumberInRange } from '@/utils/numbers'
import { choice, requiredText } from '@/utils/schemas'

import { bodyFields } from '../body/schemas'
import { ESTIMATED_GOAL_TYPES, GOAL_TYPES } from './constants'

const kcalSchema = requiredText.refine(
  (text) =>
    text === '' ||
    isNumberInRange(text, GOAL_LIMITS.dailyKcal, { mustBeInteger: true }),
  lazyMessage('goal:errors-kcal'),
)

export const manualGoalSchema = zod.object({
  goalType: choice(GOAL_TYPES),
  dailyKcal: kcalSchema,
})

export const estimateInputsSchema = zod.object({
  goalType: choice(ESTIMATED_GOAL_TYPES),
  ...bodyFields,
})

export const targetSchema = zod.object({ dailyKcal: kcalSchema })

export type ManualGoalValues = zod.input<typeof manualGoalSchema>
export type EstimateInputsValues = zod.input<typeof estimateInputsSchema>
export type TargetValues = zod.input<typeof targetSchema>
