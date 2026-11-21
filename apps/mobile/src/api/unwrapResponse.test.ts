import { ApiRequestError } from '@/utils/errors'

import { assertResponseOk, unwrapResponse } from './unwrapResponse'

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
