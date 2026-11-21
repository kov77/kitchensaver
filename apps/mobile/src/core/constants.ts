import type { AllergenCode, PlanReadinessReason } from '@/api/types'

import type { GoalType } from './types'

export const RESPONSE_STATUS_CODE = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR_MIN: 500,
} as const

export const MAX_REQUEST_RETRIES = 2

export const SKIP_GLOBAL_ERROR_META_KEY = 'skipGlobalError'

export const TOAST_DURATION_MS = 5000
export const MAX_VISIBLE_TOASTS = 3

export const NETWORK_ERROR_PATTERN = /network request failed|failed to fetch/i

export const ERROR_MESSAGES = {
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  NETWORK: 'No connection. Check your internet and try again.',
  FORBIDDEN: 'You do not have access to this.',
  NOT_FOUND: 'We could not find what you were looking for.',
  CONFLICT: 'This could not be saved right now. Please try again.',
  UNPROCESSABLE: 'Please check the information and try again.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment and try again.',
  SERVER: 'The server had a problem. Please try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const

export const DISPLAY_DATE_LOCALE = 'en-GB'
export const DISPLAY_DATE_FORMAT = { dateStyle: 'long' } as const

export const MIN_PROFILE_AGE = 18
export const MAX_PROFILE_AGE = 120
export const NAME_MAX_LENGTH = 80

export const GOAL_LIMITS = {
  dailyKcal: { min: 500, max: 10_000 },
  heightCm: { min: 90, max: 250 },
  weightKg: { min: 20, max: 400 },
} as const

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  LOSE: 'Lose weight',
  MAINTAIN: 'Maintain weight',
  GAIN: 'Gain weight',
  CUSTOM: 'Custom goal',
}

export const PERSON_SUMMARY_TEXT = {
  noGoal: 'No goal yet',
  kcalPerDay: 'kcal/day',
  notReady: 'Not ready to plan',
} as const

export const READINESS_HINTS: Record<PlanReadinessReason, string> = {
  MISSING_GOAL: 'add a daily calorie goal',
  GOAL_REVIEW_REQUIRED: 'review the goal',
  GOAL_NOT_VALID_FOR_AGE: 'the goal does not fit this age',
  ALLERGY_STATUS_MISSING: 'answer the allergy question',
}

export const ALLERGEN_LABELS: Record<AllergenCode, string> = {
  MILK: 'Milk',
  EGG: 'Eggs',
  FISH: 'Fish',
  CRUSTACEAN_SHELLFISH: 'Crustaceans',
  MOLLUSC: 'Molluscs',
  TREE_NUT: 'Tree nuts',
  PEANUT: 'Peanuts',
  WHEAT: 'Wheat',
  SOY: 'Soy',
  SESAME: 'Sesame',
  MUSTARD: 'Mustard',
  SULPHITES: 'Sulphites',
  OTHER: 'Other',
}
