import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'

import { toAuthFailure } from './authFailure'

describe('toAuthFailure', () => {
  it.each([
    ['invalid_credentials', 'INVALID_CREDENTIALS'],
    ['email_not_confirmed', 'EMAIL_NOT_CONFIRMED'],
    ['email_exists', 'ACCOUNT_EXISTS'],
    ['user_already_exists', 'ACCOUNT_EXISTS'],
    ['weak_password', 'WEAK_PASSWORD'],
    ['email_address_invalid', 'INVALID_EMAIL'],
    ['over_request_rate_limit', 'RATE_LIMITED'],
    ['over_email_send_rate_limit', 'RATE_LIMITED'],
  ] as const)('maps %s to %s', (code, failure) => {
    expect(toAuthFailure(new AuthApiError('raw', 400, code))).toBe(failure)
  })

  it('maps an unknown code to UNKNOWN', () => {
    expect(
      toAuthFailure(new AuthApiError('raw', 500, 'unexpected_failure')),
    ).toBe('UNKNOWN')
  })

  it('maps an error without a code to UNKNOWN', () => {
    expect(toAuthFailure(new AuthApiError('raw', 500, undefined))).toBe(
      'UNKNOWN',
    )
  })

  it('maps a lost connection to NETWORK', () => {
    expect(toAuthFailure(new AuthRetryableFetchError('raw', 0))).toBe('NETWORK')
  })
})
