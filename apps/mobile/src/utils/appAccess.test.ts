import { getAppAccess } from './appAccess'

describe('getAppAccess', () => {
  it.each([
    ['loading', false, undefined, false, undefined, 'loading'],
    ['signedOut', true, undefined, true, undefined, 'signedOut'],
    ['signedIn', true, undefined, false, undefined, 'loading'],
    ['signedIn', false, undefined, false, undefined, 'unavailable'],
    ['signedIn', false, false, false, undefined, 'consentRequired'],
    ['signedIn', false, true, true, undefined, 'loading'],
    ['signedIn', false, true, false, undefined, 'unavailable'],
    ['signedIn', false, true, false, false, 'onboardingRequired'],
    ['signedIn', false, true, false, true, 'ready'],
  ] as const)(
    'session %s, me loading %s, consent %s, people loading %s, has profile %s gives %s',
    (
      sessionStatus,
      isMeLoading,
      isConsentComplete,
      isPeopleLoading,
      hasProfile,
      expected,
    ) => {
      expect(
        getAppAccess({
          sessionStatus,
          isMeLoading,
          isConsentComplete,
          isPeopleLoading,
          hasProfile,
        }),
      ).toBe(expected)
    },
  )

  it('never opens the app while consent or the profile is unknown', () => {
    const unknown = [
      { isConsentComplete: undefined, hasProfile: true },
      { isConsentComplete: false, hasProfile: true },
      { isConsentComplete: true, hasProfile: undefined },
      { isConsentComplete: true, hasProfile: false },
    ]

    for (const { isConsentComplete, hasProfile } of unknown) {
      expect(
        getAppAccess({
          sessionStatus: 'signedIn',
          isMeLoading: false,
          isConsentComplete,
          isPeopleLoading: false,
          hasProfile,
        }),
      ).not.toBe('ready')
    }
  })
})
