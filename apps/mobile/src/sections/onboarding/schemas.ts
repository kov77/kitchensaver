import * as zod from 'zod'

import type { AllergenCode } from '@/api/types'
import { NAME_MAX_LENGTH } from '@/core/constants'
import { toIsoDate } from '@/utils/dates'

import {
  ALLERGEN_OPTIONS,
  ALLERGY_ANSWER,
  ONBOARDING_ERRORS,
  OTHER_ALLERGEN_CODE,
} from './constants'

type DateBounds = { minimumDate: Date; maximumDate: Date }

export function createProfileSchema({ minimumDate, maximumDate }: DateBounds) {
  return zod.object({
    name: zod
      .string()
      .trim()
      .min(1, ONBOARDING_ERRORS.nameRequired)
      .max(NAME_MAX_LENGTH, ONBOARDING_ERRORS.nameTooLong),
    dateOfBirth: zod
      .date()
      .nullable()
      .superRefine((date, context) => {
        if (date === null) {
          context.addIssue({
            code: 'custom',
            message: ONBOARDING_ERRORS.dateRequired,
          })
          return
        }
        const isoDate = toIsoDate(date)
        if (
          isoDate < toIsoDate(minimumDate) ||
          isoDate > toIsoDate(maximumDate)
        ) {
          context.addIssue({
            code: 'custom',
            message: ONBOARDING_ERRORS.dateOutOfRange,
          })
        }
      }),
  })
}

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

export type ProfileValues = zod.infer<ReturnType<typeof createProfileSchema>>
export type AllergyValues = zod.infer<typeof allergySchema>
