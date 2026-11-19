import type { AppAccess } from '@/core/types'

type AppAccessInput = {
  sessionStatus: 'loading' | 'signedOut' | 'signedIn'
  isMeLoading: boolean
  isConsentComplete: boolean | undefined
  isPeopleLoading: boolean
  hasProfile: boolean | undefined
}

export function getAppAccess({
  sessionStatus,
  isMeLoading,
  isConsentComplete,
  isPeopleLoading,
  hasProfile,
}: AppAccessInput): AppAccess {
  if (sessionStatus === 'loading') return 'loading'
  if (sessionStatus === 'signedOut') return 'signedOut'
  if (isMeLoading) return 'loading'
  if (isConsentComplete === undefined) return 'unavailable'
  if (!isConsentComplete) return 'consentRequired'
  if (isPeopleLoading) return 'loading'
  if (hasProfile === undefined) return 'unavailable'
  return hasProfile ? 'ready' : 'onboardingRequired'
}
