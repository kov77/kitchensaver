import { describe, expect, test } from 'vitest'

import { calculateAge, isSupportedAge } from './age.js'

const date = (value: string) => new Date(`${value}T00:00:00Z`)

describe('calculateAge', () => {
  test.each([
    ['2010-06-15', '2023-06-15', 13],
    ['2010-06-15', '2023-06-14', 12],
    ['2010-06-15', '2023-06-16', 13],
    ['2010-12-31', '2023-12-30', 12],
    ['2010-01-01', '2023-12-31', 13],
    ['2000-02-29', '2023-02-28', 22],
    ['2000-02-29', '2023-03-01', 23],
    ['2000-02-29', '2024-02-28', 23],
    ['2000-02-29', '2024-02-29', 24],
    ['2024-02-29', '2024-02-28', -1],
    ['2030-01-01', '2026-11-15', -4],
  ])('born %s, on %s -> %i', (born, today, expected) => {
    expect(calculateAge(date(born), date(today))).toBe(expected)
  })

  test('ignores the time of day', () => {
    const lateEvening = new Date('2023-06-14T23:59:59Z')
    expect(calculateAge(date('2010-06-15'), lateEvening)).toBe(12)
  })
})

describe('isSupportedAge', () => {
  test.each([
    [17, false],
    [18, true],
    [120, true],
    [121, false],
    [0, false],
    [-1, false],
  ])('age %i -> %s', (age, expected) => {
    expect(isSupportedAge(age)).toBe(expected)
  })
})
