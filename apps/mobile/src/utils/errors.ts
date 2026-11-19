import {
  ERROR_MESSAGES,
  MAX_REQUEST_RETRIES,
  NETWORK_ERROR_PATTERN,
  RESPONSE_STATUS_CODE,
} from '@/core/constants'

export class ApiRequestError extends Error {
  constructor(readonly status: number) {
    super(`API request failed with status ${status}`)
  }
}

export function isUnauthorizedError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === RESPONSE_STATUS_CODE.UNAUTHORIZED
  )
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    return getStatusMessage(error.status)
  }
  if (error instanceof TypeError && NETWORK_ERROR_PATTERN.test(error.message)) {
    return ERROR_MESSAGES.NETWORK
  }
  return ERROR_MESSAGES.UNKNOWN
}

function getStatusMessage(status: number) {
  if (status === RESPONSE_STATUS_CODE.UNAUTHORIZED) {
    return ERROR_MESSAGES.SESSION_EXPIRED
  }
  if (status === RESPONSE_STATUS_CODE.FORBIDDEN) return ERROR_MESSAGES.FORBIDDEN
  if (status === RESPONSE_STATUS_CODE.NOT_FOUND) return ERROR_MESSAGES.NOT_FOUND
  if (status === RESPONSE_STATUS_CODE.CONFLICT) return ERROR_MESSAGES.CONFLICT
  if (status === RESPONSE_STATUS_CODE.UNPROCESSABLE) {
    return ERROR_MESSAGES.UNPROCESSABLE
  }
  if (status === RESPONSE_STATUS_CODE.TOO_MANY_REQUESTS) {
    return ERROR_MESSAGES.TOO_MANY_REQUESTS
  }
  if (status >= RESPONSE_STATUS_CODE.SERVER_ERROR_MIN) {
    return ERROR_MESSAGES.SERVER
  }
  return ERROR_MESSAGES.UNKNOWN
}

export function shouldRetryRequest(failureCount: number, error: Error) {
  if (failureCount >= MAX_REQUEST_RETRIES) return false
  if (error instanceof ApiRequestError) {
    return error.status >= RESPONSE_STATUS_CODE.SERVER_ERROR_MIN
  }
  return true
}
