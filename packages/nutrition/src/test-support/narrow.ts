export function narrow<Value extends string>(
  allowed: readonly Value[],
  value: string,
): Value {
  const found = allowed.find((candidate) => candidate === value)
  if (found) return found
  throw new Error(`Unexpected value in the golden file: ${value}`)
}
