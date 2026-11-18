import { getAppAccess } from './appAccess'

describe('getAppAccess', () => {
  it.each([
    ['loading', false, undefined, 'loading'],
    ['signedOut', true, undefined, 'signedOut'],
    ['signedIn', true, undefined, 'loading'],
    ['signedIn', false, undefined, 'unavailable'],
    ['signedIn', false, false, 'consentRequired'],
    ['signedIn', false, true, 'ready'],
  ] as const)(
    'session %s, me loading %s, consent complete %s gives %s',
    (sessionStatus, isMeLoading, isConsentComplete, expected) => {
      expect(
        getAppAccess({ sessionStatus, isMeLoading, isConsentComplete }),
      ).toBe(expected)
    },
  )

  it('never opens the app while the account status is unknown', () => {
    expect(
      getAppAccess({
        sessionStatus: 'signedIn',
        isMeLoading: false,
        isConsentComplete: undefined,
      }),
    ).not.toBe('ready')
  })
})
