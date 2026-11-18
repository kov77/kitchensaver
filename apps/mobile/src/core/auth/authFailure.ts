import {
  isAuthRetryableFetchError,
  type AuthError,
} from '@supabase/supabase-js'

import type { AuthFailure } from './types'

const FAILURE_BY_CODE: Record<string, AuthFailure> = {
  invalid_credentials: 'INVALID_CREDENTIALS',
  email_not_confirmed: 'EMAIL_NOT_CONFIRMED',
  email_exists: 'ACCOUNT_EXISTS',
  user_already_exists: 'ACCOUNT_EXISTS',
  weak_password: 'WEAK_PASSWORD',
  email_address_invalid: 'INVALID_EMAIL',
  over_request_rate_limit: 'RATE_LIMITED',
  over_email_send_rate_limit: 'RATE_LIMITED',
}

export function toAuthFailure(error: AuthError): AuthFailure {
  if (isAuthRetryableFetchError(error)) return 'NETWORK'
  return (error.code && FAILURE_BY_CODE[error.code]) || 'UNKNOWN'
}
