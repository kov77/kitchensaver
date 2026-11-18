import type { AppAccess } from '@/core/types'

type AppAccessInput = {
  sessionStatus: 'loading' | 'signedOut' | 'signedIn'
  isMeLoading: boolean
  isConsentComplete: boolean | undefined
}

export function getAppAccess({
  sessionStatus,
  isMeLoading,
  isConsentComplete,
}: AppAccessInput): AppAccess {
  if (sessionStatus === 'loading') return 'loading'
  if (sessionStatus === 'signedOut') return 'signedOut'
  if (isMeLoading) return 'loading'
  if (isConsentComplete === undefined) return 'unavailable'
  return isConsentComplete ? 'ready' : 'consentRequired'
}
