export const RESPONSE_STATUS_CODE = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR_MIN: 500,
} as const

export const MAX_REQUEST_RETRIES = 2

export const SKIP_GLOBAL_ERROR_META_KEY = 'skipGlobalError'

export const TOAST_DURATION_MS = 5000
export const MAX_VISIBLE_TOASTS = 3

export const NETWORK_ERROR_PATTERN = /network request failed|failed to fetch/i

export const ERROR_MESSAGES = {
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  NETWORK: 'No connection. Check your internet and try again.',
  FORBIDDEN: 'You do not have access to this.',
  NOT_FOUND: 'We could not find what you were looking for.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment and try again.',
  SERVER: 'The server had a problem. Please try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const
