import { isNumberInRange, parseDecimal } from './numbers'

describe('parseDecimal', () => {
  it.each([
    ['70', 70],
    ['70.5', 70.5],
    ['70,5', 70.5],
    ['  172 ', 172],
  ])('reads %j as %d', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected)
  })

  it.each(['', 'abc', '-5', '1e3', '1.2.3', '1,', '.5', '0x10', 'Infinity'])(
    'rejects %j',
    (text) => {
      expect(parseDecimal(text)).toBeNull()
    },
  )
})

describe('isNumberInRange', () => {
  const range = { min: 500, max: 10_000 }

  it('includes both ends of the range', () => {
    expect(isNumberInRange('500', range)).toBe(true)
    expect(isNumberInRange('10000', range)).toBe(true)
  })

  it('rejects values just outside the range', () => {
    expect(isNumberInRange('499', range)).toBe(false)
    expect(isNumberInRange('10001', range)).toBe(false)
  })

  it('rejects text that is not a number', () => {
    expect(isNumberInRange('lots', range)).toBe(false)
  })

  it('can insist on a whole number', () => {
    expect(isNumberInRange('2000.5', range)).toBe(true)
    expect(isNumberInRange('2000.5', range, { mustBeInteger: true })).toBe(
      false,
    )
  })
})
