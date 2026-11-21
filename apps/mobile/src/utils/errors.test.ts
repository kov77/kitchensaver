import {
  ApiRequestError,
  getErrorMessage,
  isUnauthorizedError,
  shouldRetryRequest,
} from './errors'

describe('getErrorMessage', () => {
  it.each([
    [401, 'Your session has expired. Please log in again.'],
    [403, 'You do not have access to this.'],
    [404, 'We could not find what you were looking for.'],
    [429, 'Too many requests. Please wait a moment and try again.'],
    [500, 'The server had a problem. Please try again.'],
    [503, 'The server had a problem. Please try again.'],
    [400, 'Something went wrong. Please try again.'],
    [409, 'This could not be saved right now. Please try again.'],
    [422, 'Please check the information and try again.'],
  ])('maps status %s to a plain message', (status, message) => {
    expect(getErrorMessage(new ApiRequestError(status))).toBe(message)
  })

  it('recognizes a lost connection', () => {
    expect(getErrorMessage(new TypeError('Network request failed'))).toBe(
      'No connection. Check your internet and try again.',
    )
  })

  it('does not call a programming error a network problem', () => {
    expect(
      getErrorMessage(new TypeError('Cannot read properties of undefined')),
    ).toBe('Something went wrong. Please try again.')
  })

  it('never exposes the technical message of an unknown error', () => {
    const technical = 'SQLSTATE 42P01 relation people does not exist'

    expect(getErrorMessage(new Error(technical))).not.toContain(technical)
    expect(getErrorMessage('a thrown string')).toBe(
      'Something went wrong. Please try again.',
    )
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
