import { describe, expect, it } from 'vitest'

import { normalizeName } from './normalize-name.js'

describe('normalizeName', () => {
  it('trims, lowercases and collapses whitespace', () => {
    expect(normalizeName('  Brazil   NUTS \t')).toBe('brazil nuts')
  })

  it('treats compatibility forms as the same name', () => {
    expect(normalizeName('ＭＩＬＫ')).toBe('milk')
    expect(normalizeName('Café')).toBe(normalizeName('Café'))
  })

  it('keeps names that differ in letters apart', () => {
    expect(normalizeName('almond')).not.toBe(normalizeName('almonds'))
  })
})
