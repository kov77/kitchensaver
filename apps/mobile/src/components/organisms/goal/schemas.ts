import * as zod from 'zod'

import { GOAL_LIMITS } from '@/core/constants'
import { isNumberInRange } from '@/utils/numbers'

import {
  ACTIVITY_OPTIONS,
  ESTIMATED_GOAL_TYPES,
  GOAL_EDITOR_ERRORS,
  GOAL_TYPES,
  SEX_OPTIONS,
} from './constants'

const kcalSchema = zod
  .string()
  .refine(
    (text) =>
      isNumberInRange(text, GOAL_LIMITS.dailyKcal, { mustBeInteger: true }),
    GOAL_EDITOR_ERRORS.kcal,
  )

const choice = <Value extends string>(values: readonly Value[]) =>
  zod
    .custom<Value | null>(
      (input) => input === null || values.some((value) => value === input),
    )
    .refine((value) => value !== null, GOAL_EDITOR_ERRORS.choose)

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
      GOAL_EDITOR_ERRORS.height,
    ),
  weightKg: zod
    .string()
    .refine(
      (text) => isNumberInRange(text, GOAL_LIMITS.weightKg),
      GOAL_EDITOR_ERRORS.weight,
    ),
  activityLevel: choice(ACTIVITY_OPTIONS.map(({ value }) => value)),
  formulaSex: choice(SEX_OPTIONS.map(({ value }) => value)),
})

export const targetSchema = zod.object({ dailyKcal: kcalSchema })

export type ManualGoalValues = zod.input<typeof manualGoalSchema>
export type EstimateInputsValues = zod.input<typeof estimateInputsSchema>
export type TargetValues = zod.input<typeof targetSchema>
