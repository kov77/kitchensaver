import type { AuthFailure } from '@/core/auth/types'
import { ERROR_MESSAGES } from '@/core/constants'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

export const AUTH_FAILURE_MESSAGES: Record<AuthFailure, string> = {
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  EMAIL_NOT_CONFIRMED: 'Confirm your email first, then log in.',
  ACCOUNT_EXISTS: 'This email may already have an account. Try logging in.',
  WEAK_PASSWORD: 'Choose a stronger password.',
  INVALID_EMAIL: 'Enter a valid email address.',
  RATE_LIMITED: ERROR_MESSAGES.TOO_MANY_REQUESTS,
  NETWORK: ERROR_MESSAGES.NETWORK,
  UNKNOWN: ERROR_MESSAGES.UNKNOWN,
}

export const FIELD_ERROR_MESSAGES = {
  invalidEmail: 'Enter a valid email address.',
  passwordRequired: 'Enter your password.',
  passwordTooShort: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  passwordTooLong: `Use at most ${PASSWORD_MAX_LENGTH} characters.`,
} as const

export const CHECK_EMAIL_MESSAGE =
  'Check your email to confirm your account, then log in.'

export const SIGN_IN_TEXT = {
  title: 'Welcome back.',
  subtitle: 'Sign in to continue your meal planning.',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'Password',
  submit: 'Log in',
  footerPrompt: 'New here?',
  footerLink: 'Create an account',
} as const

export const SIGN_UP_TEXT = {
  title: 'Make meals feel easy.',
  subtitle: 'One account. Your people, recipes & plans.',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'Password',
  passwordPlaceholder: `At least ${PASSWORD_MIN_LENGTH} characters`,
  submit: 'Create account',
  footerPrompt: 'Already have an account?',
  footerLink: 'Log in',
} as const
