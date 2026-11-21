export function getInitial(name: string) {
  const [firstCharacter = ''] = Array.from(name.trim())
  return firstCharacter.toLocaleUpperCase()
}
