import { resolveLocale } from './locale'

describe('resolveLocale', () => {
  it('returns the first supported language of the device', () => {
    expect(resolveLocale(['de', 'en'])).toBe('en')
  })

  it('falls back to English when no device language is supported', () => {
    expect(resolveLocale(['de', null])).toBe('en')
  })

  it('falls back to English when the device reports no languages', () => {
    expect(resolveLocale([])).toBe('en')
  })
})
