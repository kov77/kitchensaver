export function toOptions<Value extends string>(
  values: readonly Value[],
  getLabel: (value: Value) => string,
) {
  return values.map((value) => ({ value, label: getLabel(value) }))
}
