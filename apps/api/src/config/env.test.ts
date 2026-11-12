import { describe, expect, it } from 'vitest'

import { validateEnv } from './env.js'

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  AUTH_JWKS_URL: 'https://auth.example.test/.well-known/jwks.json',
  AUTH_ISSUER: 'https://auth.example.test',
  AUTH_AUDIENCE: 'authenticated',
}

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

  it.each(['AUTH_JWKS_URL', 'AUTH_ISSUER', 'AUTH_AUDIENCE'])(
    'rejects a missing %s',
    (name) => {
      const { [name]: _removed, ...rest } = validEnv as Record<string, string>

      expect(() => validateEnv(rest)).toThrow(new RegExp(name))
    },
  )

  it('rejects a JWKS url that is not https', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        AUTH_JWKS_URL: 'http://auth.example.test/jwks',
      }),
    ).toThrow(/AUTH_JWKS_URL/)
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
