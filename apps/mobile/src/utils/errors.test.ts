import { ERROR_MESSAGES } from '@/core/constants'

import {
  ApiRequestError,
  getErrorMessage,
  isUnauthorizedError,
  shouldRetryRequest,
} from './errors'

describe('getErrorMessage', () => {
  it.each([
    [401, ERROR_MESSAGES.SESSION_EXPIRED],
    [403, ERROR_MESSAGES.FORBIDDEN],
    [404, ERROR_MESSAGES.NOT_FOUND],
    [429, ERROR_MESSAGES.TOO_MANY_REQUESTS],
    [500, ERROR_MESSAGES.SERVER],
    [503, ERROR_MESSAGES.SERVER],
    [400, ERROR_MESSAGES.UNKNOWN],
    [422, ERROR_MESSAGES.UNKNOWN],
  ])('maps status %s to a plain message', (status, message) => {
    expect(getErrorMessage(new ApiRequestError(status))).toBe(message)
  })

  it('recognizes a lost connection', () => {
    expect(getErrorMessage(new TypeError('Network request failed'))).toBe(
      ERROR_MESSAGES.NETWORK,
    )
  })

  it('does not call a programming error a network problem', () => {
    expect(
      getErrorMessage(new TypeError('Cannot read properties of undefined')),
    ).toBe(ERROR_MESSAGES.UNKNOWN)
  })

  it('never exposes the technical message of an unknown error', () => {
    const technical = 'SQLSTATE 42P01 relation people does not exist'

    expect(getErrorMessage(new Error(technical))).not.toContain(technical)
    expect(getErrorMessage('a thrown string')).toBe(ERROR_MESSAGES.UNKNOWN)
  })
})

describe('isUnauthorizedError', () => {
  it('is true only for a 401 API error', () => {
    expect(isUnauthorizedError(new ApiRequestError(401))).toBe(true)
    expect(isUnauthorizedError(new ApiRequestError(403))).toBe(false)
    expect(isUnauthorizedError(new Error('401'))).toBe(false)
    expect(isUnauthorizedError(undefined)).toBe(false)
  })
})

describe('shouldRetryRequest', () => {
  it('retries server errors and network failures', () => {
    expect(shouldRetryRequest(0, new ApiRequestError(503))).toBe(true)
    expect(shouldRetryRequest(1, new TypeError('Network request failed'))).toBe(
      true,
    )
  })

  it('does not retry client errors', () => {
    expect(shouldRetryRequest(0, new ApiRequestError(401))).toBe(false)
    expect(shouldRetryRequest(0, new ApiRequestError(404))).toBe(false)
    expect(shouldRetryRequest(0, new ApiRequestError(422))).toBe(false)
  })

  it('stops after the retry limit', () => {
    expect(shouldRetryRequest(2, new ApiRequestError(503))).toBe(false)
  })
})
