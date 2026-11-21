import * as zod from 'zod'

import { NAME_MAX_LENGTH } from '@/core/constants'
import { toIsoDate } from '@/utils/dates'

import { PROFILE_ERRORS } from './constants'

type DateBounds = { minimumDate: Date; maximumDate: Date }

export function createProfileSchema({ minimumDate, maximumDate }: DateBounds) {
  return zod.object({
    name: zod
      .string()
      .trim()
      .min(1, PROFILE_ERRORS.nameRequired)
      .max(NAME_MAX_LENGTH, PROFILE_ERRORS.nameTooLong),
    dateOfBirth: zod
      .date()
      .nullable()
      .superRefine((date, context) => {
        if (date === null) {
          context.addIssue({
            code: 'custom',
            message: PROFILE_ERRORS.dateRequired,
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
            message: PROFILE_ERRORS.dateOutOfRange,
          })
        }
      }),
  })
}

export type ProfileValues = zod.infer<ReturnType<typeof createProfileSchema>>
