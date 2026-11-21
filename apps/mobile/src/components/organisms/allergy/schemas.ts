import i18next from 'i18next'
import * as zod from 'zod'

import { NAME_MAX_LENGTH } from '@/core/constants'
import type { AllergenCode } from '@/core/types'

import {
  ALLERGEN_CODES,
  ALLERGY_ANSWER,
  OTHER_ALLERGEN_CODE,
} from './constants'

const allergenFields = {
  allergens: zod.array(
    zod.custom<AllergenCode>((input) =>
      ALLERGEN_CODES.some((code) => code === input),
    ),
  ),
  otherLabel: zod.string().trim(),
}

const allergenSelectionObject = zod.object(allergenFields)

export type AllergenSelection = zod.infer<typeof allergenSelectionObject>

function validateAllergenSelection(
  { allergens, otherLabel }: AllergenSelection,
  context: zod.RefinementCtx,
) {
  if (allergens.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['allergens'],
      message: i18next.t('allergy:errors-allergen-required'),
    })
    return
  }
  if (!allergens.includes(OTHER_ALLERGEN_CODE)) return
  if (otherLabel === '') {
    context.addIssue({
      code: 'custom',
      path: ['otherLabel'],
      message: i18next.t('allergy:errors-other-required'),
    })
    return
  }
  if (otherLabel.length > NAME_MAX_LENGTH) {
    context.addIssue({
      code: 'custom',
      path: ['otherLabel'],
      message: i18next.t('allergy:errors-other-too-long', {
        max: NAME_MAX_LENGTH,
      }),
    })
  }
}

export const allergenSelectionSchema = allergenSelectionObject.superRefine(
  validateAllergenSelection,
)

export const allergyAnswerSchema = zod
  .object({
    answer: zod.enum(Object.values(ALLERGY_ANSWER)).nullable(),
    ...allergenFields,
  })
  .superRefine((values, context) => {
    if (values.answer === null) {
      context.addIssue({
        code: 'custom',
        path: ['answer'],
        message: i18next.t('allergy:errors-answer-required'),
      })
      return
    }
    if (values.answer === ALLERGY_ANSWER.YES) {
      validateAllergenSelection(values, context)
    }
  })

export type AllergyAnswerValues = zod.infer<typeof allergyAnswerSchema>
