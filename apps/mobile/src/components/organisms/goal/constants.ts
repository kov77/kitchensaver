import type { EstimatedGoalType, GoalType } from '@/core/types'

export const GOAL_MODE = {
  MANUAL: 'MANUAL',
  ESTIMATED: 'ESTIMATED',
} as const

export const GOAL_TYPES: readonly GoalType[] = [
  'LOSE',
  'MAINTAIN',
  'GAIN',
  'CUSTOM',
]

export const ESTIMATED_GOAL_TYPES: readonly EstimatedGoalType[] = [
  'LOSE',
  'MAINTAIN',
  'GAIN',
]

export const ASSUMPTION_KEYS = [
  {
    code: 'AGE_IN_COMPLETED_YEARS',
    key: 'assumptions-AGE_IN_COMPLETED_YEARS',
  },
  {
    code: 'MAINTENANCE_ENERGY_NOT_A_TARGET',
    key: 'assumptions-MAINTENANCE_ENERGY_NOT_A_TARGET',
  },
  {
    code: 'LARGE_INDIVIDUAL_VARIATION',
    key: 'assumptions-LARGE_INDIVIDUAL_VARIATION',
  },
  {
    code: 'INCLUDES_GROWTH_ALLOWANCE',
    key: 'assumptions-INCLUDES_GROWTH_ALLOWANCE',
  },
] as const

export const UNKNOWN_ASSUMPTION_KEY = 'assumptions-unknown'
