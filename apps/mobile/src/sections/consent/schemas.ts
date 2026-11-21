import * as zod from 'zod'

import { lazyMessage } from '@/utils/messages'

const confirmedSchema = zod
  .boolean()
  .refine(
    (isChecked) => isChecked,
    lazyMessage('consent:confirmation-required'),
  )

export const consentSchema = zod.object({
  adultConfirmed: confirmedSchema,
  acceptTerms: confirmedSchema,
  acknowledgePrivacy: confirmedSchema,
})

export type ConsentValues = zod.infer<typeof consentSchema>
