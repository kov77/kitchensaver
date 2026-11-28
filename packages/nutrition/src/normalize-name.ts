export function normalizeName(name: string) {
  return name.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}
