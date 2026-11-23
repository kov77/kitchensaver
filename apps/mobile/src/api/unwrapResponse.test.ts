import { ApiRequestError } from '@/utils/errors'

import {
  assertResponseOk,
  hasErrorCode,
  unwrapResponse,
} from './unwrapResponse'

function getThrown(action: () => unknown) {
  try {
    action()
  } catch (error) {
    return error
  }
  return undefined
}

describe('unwrapResponse', () => {
  it('returns the data of a successful response', () => {
    expect(
      unwrapResponse({
        data: { id: 'a' },
        response: new Response(null, { status: 200 }),
      }),
    ).toEqual({ id: 'a' })
  })

  it('keeps an empty list as data', () => {
    expect(
      unwrapResponse({
        data: [],
        response: new Response(null, { status: 200 }),
      }),
    ).toEqual([])
  })

  it('throws when the body is JSON null', () => {
    expect(() =>
      unwrapResponse({
        data: null,
        response: new Response(null, { status: 200 }),
      }),
    ).toThrow(ApiRequestError)
  })

  it.each([401, 404, 409, 503])(
    'throws an error carrying the status %d when there is no data',
    (status) => {
      expect(() =>
        unwrapResponse({ response: new Response(null, { status }) }),
      ).toThrow(expect.objectContaining({ status }))
    },
  )

  it('throws the shared request error type', () => {
    expect(() =>
      unwrapResponse({ response: new Response(null, { status: 500 }) }),
    ).toThrow(ApiRequestError)
  })
})

describe('assertResponseOk', () => {
  it('accepts an empty successful response', () => {
    expect(() =>
      assertResponseOk({ response: new Response(null, { status: 204 }) }),
    ).not.toThrow()
  })

  it.each([401, 404, 409, 500])('throws for status %s', (status) => {
    expect(() =>
      assertResponseOk({ response: new Response(null, { status }) }),
    ).toThrow(new ApiRequestError(status))
  })
})

describe('error code of a failed response', () => {
  const response = () => new Response(null, { status: 409 })

  it('is taken from the error body', () => {
    const body = {
      code: 'ALLERGY_ALREADY_EXISTS',
      message: 'x',
      requestId: 'r',
    }

    expect(
      getThrown(() => unwrapResponse({ error: body, response: response() })),
    ).toMatchObject({ status: 409, code: 'ALLERGY_ALREADY_EXISTS' })
    expect(
      getThrown(() => assertResponseOk({ error: body, response: response() })),
    ).toMatchObject({ status: 409, code: 'ALLERGY_ALREADY_EXISTS' })
  })

  it.each([
    ['there is no body', undefined],
    ['the body is text', 'Bad gateway'],
    ['the code is not text', { code: 409 }],
    ['the body has no code', { message: 'x' }],
  ])('is left out when %s', (_name, error) => {
    const thrown = getThrown(() =>
      unwrapResponse({ error, response: response() }),
    )

    expect(thrown).toBeInstanceOf(ApiRequestError)
    expect(thrown).toMatchObject({ status: 409, code: undefined })
  })
})

describe('hasErrorCode', () => {
  const response = new Response(null, { status: 404 })

  it('recognizes the code of the error body', () => {
    expect(
      hasErrorCode(
        { error: { code: 'PERSON_NOT_FOUND' }, response },
        'PERSON_NOT_FOUND',
      ),
    ).toBe(true)
  })

  it('tells one code from another with the same status', () => {
    expect(
      hasErrorCode(
        { error: { code: 'PERSON_NOT_FOUND' }, response },
        'BODY_PARAMETERS_NOT_FOUND',
      ),
    ).toBe(false)
  })

  it.each([undefined, 'Not found', { message: 'x' }])(
    'is false when the body is %j',
    (error) => {
      expect(hasErrorCode({ error, response }, 'PERSON_NOT_FOUND')).toBe(false)
    },
  )
})
