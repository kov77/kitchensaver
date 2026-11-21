import type { ParseKeys } from 'i18next'

import type { AllergenCode } from '@/api/types'

import type { FlowState } from './types'

export const INITIAL_FLOW_STATE: FlowState = { step: 'profile', profile: null }

export const ALLERGY_ANSWER = {
  YES: 'yes',
  NO: 'no',
  UNKNOWN: 'unknown',
} as const

export const OTHER_ALLERGEN_CODE = 'OTHER'

export const ALLERGEN_CODES: readonly AllergenCode[] = [
  'MILK',
  'EGG',
  'FISH',
  'CRUSTACEAN_SHELLFISH',
  'MOLLUSC',
  'TREE_NUT',
  'PEANUT',
  'WHEAT',
  'SOY',
  'SESAME',
  'MUSTARD',
  'SULPHITES',
  'OTHER',
]

export const ALLERGY_ANSWER_LABEL_KEYS: Record<
  (typeof ALLERGY_ANSWER)[keyof typeof ALLERGY_ANSWER],
  ParseKeys<'onboarding'>
> = {
  [ALLERGY_ANSWER.YES]: 'answer-yes',
  [ALLERGY_ANSWER.NO]: 'answer-no',
  [ALLERGY_ANSWER.UNKNOWN]: 'answer-unknown',
}
