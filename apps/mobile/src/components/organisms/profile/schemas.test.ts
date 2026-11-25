import { MAX_PROFILE_AGE, MIN_PROFILE_AGE } from '@/core/constants'
import { subtractYears } from '@/utils/dates'

import { createProfileSchema } from './schemas'

const TODAY = new Date(2026, 10, 18, 15, 30)
const AGE_OUT_OF_RANGE = 'The age must be between 18 and 120.'

const profileSchema = createProfileSchema({
  minimumDate: subtractYears(TODAY, MAX_PROFILE_AGE),
  maximumDate: subtractYears(TODAY, MIN_PROFILE_AGE),
})

function dateErrors(dateOfBirth: Date | null) {
  const result = profileSchema.safeParse({ name: 'Alex', dateOfBirth })
  return result.success ? [] : result.error.issues.map(({ message }) => message)
}

describe('profile schema date of birth', () => {
  it('requires the adult minimum age of 18', () => {
    expect(MIN_PROFILE_AGE).toBe(18)
  })

  it('accepts a person who turns 18 today, whatever the time of day', () => {
    expect(dateErrors(new Date(2008, 10, 18, 23, 59))).toEqual([])
    expect(dateErrors(new Date(2008, 10, 18, 0, 0))).toEqual([])
  })

  it('rejects a person who turns 18 tomorrow', () => {
    expect(dateErrors(new Date(2008, 10, 19))).toEqual([AGE_OUT_OF_RANGE])
  })

  it('rejects a teenager', () => {
    expect(dateErrors(new Date(2011, 5, 1))).toEqual([AGE_OUT_OF_RANGE])
  })

  it('accepts the oldest allowed date and rejects the day before it', () => {
    expect(dateErrors(new Date(1906, 10, 18, 12))).toEqual([])
    expect(dateErrors(new Date(1906, 10, 17))).toEqual([AGE_OUT_OF_RANGE])
  })

  it('asks for a date when none is chosen', () => {
    expect(dateErrors(null)).toEqual(['This field is required.'])
  })
})
