export const MIN_PROFILE_AGE = 18
export const MAX_PROFILE_AGE = 120

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function utcParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  }
}

// Whole years on the UTC calendar date; a Feb 29 birthday counts as Mar 1 in non-leap years.
export function calculateAge(dateOfBirth: Date, now: Date): number {
  const birth = utcParts(dateOfBirth)
  const { year, month, day } = utcParts(now)
  const isLeapDay = birth.month === 1 && birth.day === 29
  const moveToMarch = isLeapDay && !isLeapYear(year)
  const anniversaryMonth = moveToMarch ? 2 : birth.month
  const anniversaryDay = moveToMarch ? 1 : birth.day

  const hadBirthday =
    month > anniversaryMonth ||
    (month === anniversaryMonth && day >= anniversaryDay)
  return year - birth.year - (hadBirthday ? 0 : 1)
}

export function isSupportedAge(age: number) {
  return age >= MIN_PROFILE_AGE && age <= MAX_PROFILE_AGE
}
