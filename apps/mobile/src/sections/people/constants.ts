import type { PlanReadinessReason } from '@/api/types'

export const PEOPLE_TEXT = {
  title: 'Your people',
  subtitle: 'Save individual goals once. Plan together.',
  retry: 'Try again',
  logOut: 'Log out',
  empty: 'There are no active profiles yet.',
  noGoal: 'No goal yet',
  kcalPerDay: 'kcal/day',
  notReady: 'Not ready to plan',
  cardHint: 'Opens the daily calorie goal',
} as const

export const READINESS_HINTS: Record<PlanReadinessReason, string> = {
  MISSING_GOAL: 'add a daily calorie goal',
  GOAL_REVIEW_REQUIRED: 'review the goal',
  GOAL_NOT_VALID_FOR_AGE: 'the goal does not fit this age',
  ALLERGY_STATUS_MISSING: 'answer the allergy question',
}
