import type { PlanReadinessReason } from '@/api/types'
import type { CommonKey } from '@/translations/types'

import type {
  ActivityLevel,
  AllergenCode,
  FormulaSex,
  GoalType,
  Rating,
} from './types'

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

export const DISPLAY_DATE_LOCALE = 'en-GB'
export const DISPLAY_DATE_FORMAT = { dateStyle: 'long' } as const

export const MIN_PROFILE_AGE = 18
export const MAX_PROFILE_AGE = 120
export const NAME_MAX_LENGTH = 80

export const RATINGS: readonly Rating[] = [1, 2, 3, 4, 5]

export const RATING_LIMITS = {
  min: Math.min(...RATINGS),
  max: Math.max(...RATINGS),
} as const

export const DEFAULT_RATING: Rating = 3

export const GOAL_LIMITS = {
  dailyKcal: { min: 500, max: 10_000 },
  heightCm: { min: 90, max: 250 },
  weightKg: { min: 20, max: 400 },
} as const

export const ALLERGEN_LABEL_KEYS: Record<AllergenCode, CommonKey> = {
  MILK: 'common:allergens-MILK',
  EGG: 'common:allergens-EGG',
  FISH: 'common:allergens-FISH',
  CRUSTACEAN_SHELLFISH: 'common:allergens-CRUSTACEAN_SHELLFISH',
  MOLLUSC: 'common:allergens-MOLLUSC',
  TREE_NUT: 'common:allergens-TREE_NUT',
  PEANUT: 'common:allergens-PEANUT',
  WHEAT: 'common:allergens-WHEAT',
  SOY: 'common:allergens-SOY',
  SESAME: 'common:allergens-SESAME',
  MUSTARD: 'common:allergens-MUSTARD',
  SULPHITES: 'common:allergens-SULPHITES',
  OTHER: 'common:allergens-OTHER',
}

export const GOAL_TYPE_LABEL_KEYS: Record<GoalType, CommonKey> = {
  LOSE: 'common:goal-types-LOSE',
  MAINTAIN: 'common:goal-types-MAINTAIN',
  GAIN: 'common:goal-types-GAIN',
  CUSTOM: 'common:goal-types-CUSTOM',
}

export const ACTIVITY_LEVEL_LABEL_KEYS: Record<ActivityLevel, CommonKey> = {
  INACTIVE: 'common:activity-levels-INACTIVE',
  LOW_ACTIVE: 'common:activity-levels-LOW_ACTIVE',
  ACTIVE: 'common:activity-levels-ACTIVE',
  VERY_ACTIVE: 'common:activity-levels-VERY_ACTIVE',
}

export const SEX_LABEL_KEYS: Record<FormulaSex, CommonKey> = {
  MALE: 'common:sexes-MALE',
  FEMALE: 'common:sexes-FEMALE',
}

export const READINESS_HINT_KEYS: Record<PlanReadinessReason, CommonKey> = {
  MISSING_GOAL: 'common:readiness-hints-MISSING_GOAL',
  GOAL_REVIEW_REQUIRED: 'common:readiness-hints-GOAL_REVIEW_REQUIRED',
  GOAL_NOT_VALID_FOR_AGE: 'common:readiness-hints-GOAL_NOT_VALID_FOR_AGE',
  ALLERGY_STATUS_MISSING: 'common:readiness-hints-ALLERGY_STATUS_MISSING',
}

export const KCAL_WARNING_ERROR_CODE = 'GOAL_KCAL_OUT_OF_RANGE'

export const ERROR_CODE_MESSAGE_KEYS = new Map<string, CommonKey>([
  ['ALLERGY_ALREADY_EXISTS', 'common:errors-codes-ALLERGY_ALREADY_EXISTS'],
  ['ALLERGIES_EXIST', 'common:errors-codes-ALLERGIES_EXIST'],
  ['EXCLUSION_ALREADY_EXISTS', 'common:errors-codes-FOOD_ALREADY_EXISTS'],
  ['PREFERENCE_ALREADY_EXISTS', 'common:errors-codes-FOOD_ALREADY_EXISTS'],
  [
    'RESTRICTION_LIMIT_REACHED',
    'common:errors-codes-RESTRICTION_LIMIT_REACHED',
  ],
  ['PROFILE_LIMIT_REACHED', 'common:errors-codes-PROFILE_LIMIT_REACHED'],
  ['PROFILE_TOTAL_LIMIT_REACHED', 'common:errors-codes-PROFILE_LIMIT_REACHED'],
  ['GOAL_KCAL_BELOW_MINIMUM', 'common:errors-codes-GOAL_KCAL_BELOW_MINIMUM'],
])
