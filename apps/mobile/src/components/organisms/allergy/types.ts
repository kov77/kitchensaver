import type { ALLERGY_ANSWER, ANSWER_ALLERGY_STATUS } from './constants'

export type AllergyAnswerValue =
  (typeof ALLERGY_ANSWER)[keyof typeof ALLERGY_ANSWER]

export type WarnedAnswer = keyof typeof ANSWER_ALLERGY_STATUS
