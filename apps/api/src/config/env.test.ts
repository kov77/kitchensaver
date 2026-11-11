import { describe, expect, it } from 'vitest'

import { validateEnv } from './env.js'

describe('validateEnv', () => {
  it('applies defaults', () => {
    expect(validateEnv({})).toEqual({ NODE_ENV: 'development', PORT: 3000 })
  })

  it('coerces PORT from a string', () => {
    expect(validateEnv({ PORT: '8080' }).PORT).toBe(8080)
  })

  it('rejects an invalid PORT', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(
      /Invalid environment configuration: PORT/,
    )
  })

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/)
  })
})
