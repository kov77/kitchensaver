import { describe, expect, it } from 'vitest'

import { validateEnv } from './env.js'

const validEnv = { DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' }

describe('validateEnv', () => {
  it('applies defaults', () => {
    expect(validateEnv(validEnv)).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      ...validEnv,
    })
  })

  it('coerces PORT from a string', () => {
    expect(validateEnv({ ...validEnv, PORT: '8080' }).PORT).toBe(8080)
  })

  it('rejects an invalid PORT', () => {
    expect(() => validateEnv({ ...validEnv, PORT: 'abc' })).toThrow(
      /Invalid environment configuration: PORT/,
    )
  })

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    )
  })

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/)
  })

  it('rejects a DATABASE_URL that is not a postgres URL', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: 'mysql://user:pass@localhost/db' }),
    ).toThrow(/DATABASE_URL/)
  })

  it('does not leak the DATABASE_URL value in the error', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: 'mysql://user:secret-pass@localhost/db' }),
    ).not.toThrow(/secret-pass/)
  })
})
