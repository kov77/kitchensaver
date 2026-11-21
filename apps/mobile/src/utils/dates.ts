import { DISPLAY_DATE_FORMAT, DISPLAY_DATE_LOCALE } from '@/core/constants'

const MONTH_NUMBER_OFFSET = 1
const DATE_PART_LENGTH = 2

export function toIsoDate(date: Date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + MONTH_NUMBER_OFFSET)
  const day = String(date.getDate())
  return [
    year,
    month.padStart(DATE_PART_LENGTH, '0'),
    day.padStart(DATE_PART_LENGTH, '0'),
  ].join('-')
}

export function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat(
    DISPLAY_DATE_LOCALE,
    DISPLAY_DATE_FORMAT,
  ).format(date)
}

function getLastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + MONTH_NUMBER_OFFSET, 0).getDate()
}

export function subtractYears(date: Date, years: number) {
  const year = date.getFullYear() - years
  const month = date.getMonth()
  const day = Math.min(date.getDate(), getLastDayOfMonth(year, month))
  return new Date(year, month, day)
}

export function parseIsoDate(isoDate: string) {
  const [year = 0, month = 0, day = 0] = isoDate.split('-').map(Number)
  return new Date(year, month - MONTH_NUMBER_OFFSET, day)
}
