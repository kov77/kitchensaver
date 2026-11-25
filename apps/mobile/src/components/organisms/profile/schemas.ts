import i18next from 'i18next'
import * as zod from 'zod'

import {
  MAX_PROFILE_AGE,
  MIN_PROFILE_AGE,
  NAME_MAX_LENGTH,
} from '@/core/constants'
import { toIsoDate } from '@/utils/dates'
import { getRequiredMessage, lazyMessage } from '@/utils/messages'
import { requiredText } from '@/utils/schemas'

type DateBounds = { minimumDate: Date; maximumDate: Date }

export function createProfileSchema({ minimumDate, maximumDate }: DateBounds) {
  return zod.object({
    name: requiredText.max(
      NAME_MAX_LENGTH,
      lazyMessage('profile:errors-name-too-long', { max: NAME_MAX_LENGTH }),
    ),
    dateOfBirth: zod
      .date()
      .nullable()
      .superRefine((date, context) => {
        if (date === null) {
          context.addIssue({
            code: 'custom',
            message: getRequiredMessage(),
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
            message: i18next.t('profile:errors-date-out-of-range', {
              min: MIN_PROFILE_AGE,
              max: MAX_PROFILE_AGE,
            }),
          })
        }
      }),
  })
}

export type ProfileValues = zod.infer<ReturnType<typeof createProfileSchema>>
