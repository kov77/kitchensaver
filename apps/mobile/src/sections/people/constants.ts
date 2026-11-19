import type { PersonGoal, PlanReadinessReason } from '@/api/types'

export const PEOPLE_TEXT = {
  title: 'Your people',
  subtitle: 'Save individual goals once. Plan together.',
  retry: 'Try again',
  logOut: 'Log out',
  empty: 'There are no active profiles yet.',
  noGoal: 'No goal yet',
  kcalPerDay: 'kcal/day',
  notReady: 'Not ready to plan',
} as const

export const GOAL_TYPE_LABELS: Record<PersonGoal['goalType'], string> = {
  LOSE: 'Lose weight',
  MAINTAIN: 'Maintain weight',
  GAIN: 'Gain weight',
  CUSTOM: 'Custom goal',
}

export const READINESS_HINTS: Record<PlanReadinessReason, string> = {
  MISSING_GOAL: 'add a daily calorie goal',
  GOAL_REVIEW_REQUIRED: 'review the goal',
  GOAL_NOT_VALID_FOR_AGE: 'the goal does not fit this age',
  ALLERGY_STATUS_MISSING: 'answer the allergy question',
}
