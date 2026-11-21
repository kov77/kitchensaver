import * as zod from 'zod'

import type { AllergenCode } from '@/api/types'
import { NAME_MAX_LENGTH } from '@/core/constants'

import {
  ALLERGEN_OPTIONS,
  ALLERGY_ANSWER,
  ONBOARDING_ERRORS,
  OTHER_ALLERGEN_CODE,
} from './constants'

export const allergySchema = zod
  .object({
    answer: zod.enum(Object.values(ALLERGY_ANSWER)).nullable(),
    allergens: zod.array(
      zod.custom<AllergenCode>((input) =>
        ALLERGEN_OPTIONS.some(({ value }) => value === input),
      ),
    ),
    otherLabel: zod
      .string()
      .trim()
      .max(NAME_MAX_LENGTH, ONBOARDING_ERRORS.otherTooLong),
  })
  .superRefine(({ answer, allergens, otherLabel }, context) => {
    if (answer === null) {
      context.addIssue({
        code: 'custom',
        path: ['answer'],
        message: ONBOARDING_ERRORS.answerRequired,
      })
      return
    }
    if (answer !== ALLERGY_ANSWER.YES) return
    if (allergens.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['allergens'],
        message: ONBOARDING_ERRORS.allergenRequired,
      })
      return
    }
    if (allergens.includes(OTHER_ALLERGEN_CODE) && otherLabel === '') {
      context.addIssue({
        code: 'custom',
        path: ['otherLabel'],
        message: ONBOARDING_ERRORS.otherRequired,
      })
    }
  })

export type AllergyValues = zod.infer<typeof allergySchema>
