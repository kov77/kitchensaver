import type { PersonGoal, PersonListItem } from '@/api/types'

export type AppAccess =
  | 'loading'
  | 'unavailable'
  | 'signedOut'
  | 'consentRequired'
  | 'onboardingRequired'
  | 'ready'

export type GoalType = 'LOSE' | 'MAINTAIN' | 'GAIN' | 'CUSTOM'

export type EstimatedGoalType = Exclude<GoalType, 'CUSTOM'>

export type ActivityLevel = 'INACTIVE' | 'LOW_ACTIVE' | 'ACTIVE' | 'VERY_ACTIVE'

export type FormulaSex = 'MALE' | 'FEMALE'

export type EstimateInput = {
  goalType: EstimatedGoalType
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  formulaSex: FormulaSex
}

export type GoalEstimate = {
  estimatedMaintenanceKcal: number
  methodology: string
  assumptions: string[]
}

export type GoalDraft =
  | { mode: 'MANUAL'; goalType: GoalType; dailyKcal: number }
  | ({ mode: 'ESTIMATED'; dailyKcal: number } & EstimateInput)

export type GoalSummary = PersonGoal

export type PlanReadiness = PersonListItem['planReadiness']
