import { findRating } from './ratings'

describe('findRating', () => {
  it.each([1, 2, 3, 4, 5])('accepts %s', (value) => {
    expect(findRating(value)).toBe(value)
  })

  it.each([0, 6, 2.5, -1, Number.NaN])('rejects %s', (value) => {
    expect(findRating(value)).toBeUndefined()
  })
})
