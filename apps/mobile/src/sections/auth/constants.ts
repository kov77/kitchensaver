import type { ParseKeys } from 'i18next'

import type { AuthFailure } from '@/core/auth/types'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

export const AUTH_FAILURE_KEYS: Record<
  AuthFailure,
  ParseKeys<['auth', 'common']>
> = {
  INVALID_CREDENTIALS: 'auth-failures-INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'auth-failures-EMAIL_NOT_CONFIRMED',
  ACCOUNT_EXISTS: 'auth-failures-ACCOUNT_EXISTS',
  WEAK_PASSWORD: 'auth-failures-WEAK_PASSWORD',
  INVALID_EMAIL: 'auth-failures-INVALID_EMAIL',
  RATE_LIMITED: 'common:errors-too-many-requests',
  NETWORK: 'common:errors-network',
  UNKNOWN: 'common:errors-unknown',
}
