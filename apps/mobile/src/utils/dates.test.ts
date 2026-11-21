import {
  formatDisplayDate,
  parseIsoDate,
  subtractYears,
  toIsoDate,
} from './dates'

describe('toIsoDate', () => {
  it('uses the local calendar date, not the UTC one', () => {
    expect(toIsoDate(new Date(2010, 0, 5, 23, 59))).toBe('2010-01-05')
  })

  it('pads month and day', () => {
    expect(toIsoDate(new Date(1999, 8, 3))).toBe('1999-09-03')
  })
})

describe('formatDisplayDate', () => {
  it('writes the month as a word so day and month cannot be confused', () => {
    expect(formatDisplayDate(new Date(2010, 2, 4))).toBe('4 March 2010')
  })
})

describe('subtractYears', () => {
  it('moves back by whole years and leaves the original untouched', () => {
    const today = new Date(2026, 10, 18)

    expect(toIsoDate(subtractYears(today, 13))).toBe('2013-11-18')
    expect(toIsoDate(today)).toBe('2026-11-18')
  })

  it('uses the last day of February when the leap day has no counterpart', () => {
    expect(toIsoDate(subtractYears(new Date(2028, 1, 29), 18))).toBe(
      '2010-02-28',
    )
  })

  it('keeps the leap day when the target year has one', () => {
    expect(toIsoDate(subtractYears(new Date(2028, 1, 29), 120))).toBe(
      '1908-02-29',
    )
  })
})

describe('parseIsoDate', () => {
  it('reads the calendar date in local time', () => {
    const date = parseIsoDate('1990-03-04')

    expect(date.getFullYear()).toBe(1990)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(4)
  })

  it('round-trips with toIsoDate', () => {
    expect(toIsoDate(parseIsoDate('2000-02-29'))).toBe('2000-02-29')
  })
})
