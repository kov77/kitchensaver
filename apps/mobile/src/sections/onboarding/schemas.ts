import i18next from 'i18next'
import * as zod from 'zod'

import type { AllergenCode } from '@/api/types'
import { NAME_MAX_LENGTH } from '@/core/constants'
import { lazyMessage } from '@/utils/messages'

import {
  ALLERGEN_CODES,
  ALLERGY_ANSWER,
  OTHER_ALLERGEN_CODE,
} from './constants'

export const allergySchema = zod
  .object({
    answer: zod.enum(Object.values(ALLERGY_ANSWER)).nullable(),
    allergens: zod.array(
      zod.custom<AllergenCode>((input) =>
        ALLERGEN_CODES.some((code) => code === input),
      ),
    ),
    otherLabel: zod
      .string()
      .trim()
      .max(
        NAME_MAX_LENGTH,
        lazyMessage('onboarding:errors-other-too-long', {
          max: NAME_MAX_LENGTH,
        }),
      ),
  })
  .superRefine(({ answer, allergens, otherLabel }, context) => {
    if (answer === null) {
      context.addIssue({
        code: 'custom',
        path: ['answer'],
        message: i18next.t('onboarding:errors-answer-required'),
      })
      return
    }
    if (answer !== ALLERGY_ANSWER.YES) return
    if (allergens.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['allergens'],
        message: i18next.t('onboarding:errors-allergen-required'),
      })
      return
    }
    if (allergens.includes(OTHER_ALLERGEN_CODE) && otherLabel === '') {
      context.addIssue({
        code: 'custom',
        path: ['otherLabel'],
        message: i18next.t('onboarding:errors-other-required'),
      })
    }
  })

export type AllergyValues = zod.infer<typeof allergySchema>
