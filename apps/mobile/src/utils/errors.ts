import i18next from 'i18next'

import {
  ERROR_CODE_MESSAGE_KEYS,
  MAX_REQUEST_RETRIES,
  NETWORK_ERROR_PATTERN,
  RESPONSE_STATUS_CODE,
} from '@/core/constants'

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
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
    return getApiErrorMessage(error)
  }
  if (error instanceof TypeError && NETWORK_ERROR_PATTERN.test(error.message)) {
    return i18next.t('errors-network')
  }
  return i18next.t('errors-unknown')
}

function getApiErrorMessage({ status, code }: ApiRequestError) {
  const codeMessageKey =
    code === undefined ? undefined : ERROR_CODE_MESSAGE_KEYS.get(code)
  if (codeMessageKey) return i18next.t(codeMessageKey)
  return getStatusMessage(status)
}

function getStatusMessage(status: number) {
  if (status === RESPONSE_STATUS_CODE.UNAUTHORIZED) {
    return i18next.t('errors-session-expired')
  }
  if (status === RESPONSE_STATUS_CODE.FORBIDDEN)
    return i18next.t('errors-forbidden')
  if (status === RESPONSE_STATUS_CODE.NOT_FOUND)
    return i18next.t('errors-not-found')
  if (status === RESPONSE_STATUS_CODE.CONFLICT)
    return i18next.t('errors-conflict')
  if (status === RESPONSE_STATUS_CODE.UNPROCESSABLE) {
    return i18next.t('errors-unprocessable')
  }
  if (status === RESPONSE_STATUS_CODE.TOO_MANY_REQUESTS) {
    return i18next.t('errors-too-many-requests')
  }
  if (status >= RESPONSE_STATUS_CODE.SERVER_ERROR_MIN) {
    return i18next.t('errors-server')
  }
  return i18next.t('errors-unknown')
}

export function shouldRetryRequest(failureCount: number, error: Error) {
  if (failureCount >= MAX_REQUEST_RETRIES) return false
  if (error instanceof ApiRequestError) {
    return error.status >= RESPONSE_STATUS_CODE.SERVER_ERROR_MIN
  }
  return true
}
