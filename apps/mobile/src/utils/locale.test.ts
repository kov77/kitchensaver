import { resolveLocale } from './locale'

describe('resolveLocale', () => {
  it('returns the first supported language of the device', () => {
    expect(resolveLocale(['de', 'en'])).toBe('en')
  })

  it.each(['es', 'fr'])('picks %s when the device uses it first', (code) => {
    expect(resolveLocale([code, 'en'])).toBe(code)
  })

  it('skips an unsupported language before a supported one', () => {
    expect(resolveLocale(['de', 'fr'])).toBe('fr')
  })

  it('falls back to English when no device language is supported', () => {
    expect(resolveLocale(['de', null])).toBe('en')
  })

  it('falls back to English when the device reports no languages', () => {
    expect(resolveLocale([])).toBe('en')
  })
})
