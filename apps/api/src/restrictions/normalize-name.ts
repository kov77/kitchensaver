// Only for uniqueness of what the user typed; it is not a food match (Phase 4).
export function normalizeName(name: string) {
  return name.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}
