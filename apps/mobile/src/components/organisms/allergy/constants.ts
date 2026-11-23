import type { ParseKeys } from 'i18next'

import type { AllergenCode, AnswerableAllergyStatus } from '@/core/types'

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
  OTHER_ALLERGEN_CODE,
]

export const ALLERGY_ANSWER_LABEL_KEYS: Record<
  (typeof ALLERGY_ANSWER)[keyof typeof ALLERGY_ANSWER],
  ParseKeys<'allergy'>
> = {
  [ALLERGY_ANSWER.YES]: 'answer-yes',
  [ALLERGY_ANSWER.NO]: 'answer-no',
  [ALLERGY_ANSWER.UNKNOWN]: 'answer-unknown',
}

export const ANSWER_ALLERGY_STATUS: Record<
  typeof ALLERGY_ANSWER.NO | typeof ALLERGY_ANSWER.UNKNOWN,
  AnswerableAllergyStatus
> = {
  [ALLERGY_ANSWER.NO]: 'NONE',
  [ALLERGY_ANSWER.UNKNOWN]: 'UNKNOWN',
}

export const WARNING_DIALOG_KEYS: Record<
  keyof typeof ANSWER_ALLERGY_STATUS,
  { titleKey: ParseKeys<'allergy'>; messageKey: ParseKeys<'allergy'> }
> = {
  [ALLERGY_ANSWER.NO]: {
    titleKey: 'warning-dialogs-no-title',
    messageKey: 'warning-dialogs-no-message',
  },
  [ALLERGY_ANSWER.UNKNOWN]: {
    titleKey: 'warning-dialogs-unknown-title',
    messageKey: 'warning-dialogs-unknown-message',
  },
}
