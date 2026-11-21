import { ASSUMPTION_KEYS, UNKNOWN_ASSUMPTION_KEY } from './constants'

export function getAssumptionKey(assumption: string) {
  const known = ASSUMPTION_KEYS.find(({ code }) => code === assumption)
  return known?.key ?? UNKNOWN_ASSUMPTION_KEY
}
