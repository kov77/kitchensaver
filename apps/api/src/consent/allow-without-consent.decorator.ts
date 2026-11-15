import { SetMetadata } from '@nestjs/common'

export const ALLOW_WITHOUT_CONSENT_KEY = 'allowWithoutConsent'

export const AllowWithoutConsent = () =>
  SetMetadata(ALLOW_WITHOUT_CONSENT_KEY, true)
