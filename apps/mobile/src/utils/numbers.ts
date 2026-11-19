const DECIMAL_PATTERN = /^\d+([.,]\d+)?$/

type Range = { min: number; max: number }

export function parseDecimal(text: string) {
  const trimmed = text.trim()
  if (!DECIMAL_PATTERN.test(trimmed)) return null
  return Number(trimmed.replace(',', '.'))
}

export function isNumberInRange(
  text: string,
  { min, max }: Range,
  { mustBeInteger = false } = {},
) {
  const value = parseDecimal(text)
  if (value === null) return false
  if (mustBeInteger && !Number.isInteger(value)) return false
  return value >= min && value <= max
}
