export function birthDateForAge(years: number) {
  const now = new Date()
  const date = new Date(
    Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth() - 6, 1),
  )
  return date.toISOString().slice(0, 10)
}
