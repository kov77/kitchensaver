import * as zod from 'zod'

import { GOAL_LIMITS } from '@/core/constants'
import { lazyMessage } from '@/utils/messages'
import { isNumberInRange } from '@/utils/numbers'

import {
  ACTIVITY_LEVELS,
  ESTIMATED_GOAL_TYPES,
  FORMULA_SEXES,
  GOAL_TYPES,
} from './constants'

const kcalSchema = zod
  .string()
  .refine(
    (text) =>
      isNumberInRange(text, GOAL_LIMITS.dailyKcal, { mustBeInteger: true }),
    lazyMessage('goal:errors-kcal'),
  )

const choice = <Value extends string>(values: readonly Value[]) =>
  zod
    .custom<Value | null>(
      (input) => input === null || values.some((value) => value === input),
    )
    .refine((value) => value !== null, lazyMessage('goal:errors-choose'))

export const manualGoalSchema = zod.object({
  goalType: choice(GOAL_TYPES),
  dailyKcal: kcalSchema,
})

export const estimateInputsSchema = zod.object({
  goalType: choice(ESTIMATED_GOAL_TYPES),
  heightCm: zod
    .string()
    .refine(
      (text) => isNumberInRange(text, GOAL_LIMITS.heightCm),
      lazyMessage('goal:errors-height'),
    ),
  weightKg: zod
    .string()
    .refine(
      (text) => isNumberInRange(text, GOAL_LIMITS.weightKg),
      lazyMessage('goal:errors-weight'),
    ),
  activityLevel: choice(ACTIVITY_LEVELS),
  formulaSex: choice(FORMULA_SEXES),
})

export const targetSchema = zod.object({ dailyKcal: kcalSchema })

export type ManualGoalValues = zod.input<typeof manualGoalSchema>
export type EstimateInputsValues = zod.input<typeof estimateInputsSchema>
export type TargetValues = zod.input<typeof targetSchema>
