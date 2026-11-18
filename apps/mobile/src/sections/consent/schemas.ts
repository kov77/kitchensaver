import * as zod from 'zod'

import { CONSENT_TEXT } from './constants'

const confirmedSchema = zod
  .boolean()
  .refine((isChecked) => isChecked, CONSENT_TEXT.confirmationRequired)

export const consentSchema = zod.object({
  adultConfirmed: confirmedSchema,
  acceptTerms: confirmedSchema,
  acknowledgePrivacy: confirmedSchema,
})

export type ConsentValues = zod.infer<typeof consentSchema>
