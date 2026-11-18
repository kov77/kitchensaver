import type { Session } from '@supabase/supabase-js'

export type AuthFailure =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'ACCOUNT_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'UNKNOWN'

export type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: Session }

export type Credentials = { email: string; password: string }

export type SignInResult = { ok: true } | { ok: false; failure: AuthFailure }

export type SignUpResult =
  | { ok: true; emailConfirmationRequired: boolean }
  | { ok: false; failure: AuthFailure }

export type SessionContextValue = {
  state: SessionState
  signIn: (credentials: Credentials) => Promise<SignInResult>
  signUp: (credentials: Credentials) => Promise<SignUpResult>
  signOut: () => Promise<void>
}
