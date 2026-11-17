import { describe, expect, it } from 'vitest'

import { resolveTestDatabaseUrl } from './test-database-url.js'

const testUrl = 'postgresql://test:test@localhost:5432/test'
const devUrl = 'postgresql://dev:dev@localhost:5432/dev'

describe('resolveTestDatabaseUrl', () => {
  it('returns the test database url', () => {
    expect(
      resolveTestDatabaseUrl({
        TEST_DATABASE_URL: testUrl,
        DATABASE_URL: devUrl,
      }),
    ).toBe(testUrl)
  })

  it('works when DATABASE_URL is not set (CI)', () => {
    expect(resolveTestDatabaseUrl({ TEST_DATABASE_URL: testUrl })).toBe(testUrl)
  })

  it('rejects a missing TEST_DATABASE_URL', () => {
    expect(() => resolveTestDatabaseUrl({ DATABASE_URL: devUrl })).toThrow(
      /TEST_DATABASE_URL is required/,
    )
  })

  it('rejects an empty TEST_DATABASE_URL', () => {
    expect(() => resolveTestDatabaseUrl({ TEST_DATABASE_URL: '' })).toThrow(
      /TEST_DATABASE_URL is required/,
    )
  })

  it('rejects the development database as the test database', () => {
    expect(() =>
      resolveTestDatabaseUrl({
        TEST_DATABASE_URL: devUrl,
        DATABASE_URL: devUrl,
      }),
    ).toThrow(/must not point to the same database/)
  })

  it.each(['railway', 'kitchensaver', 'kitchensaver_dev', 'attest'])(
    'rejects the database name %s',
    (name) => {
      expect(() =>
        resolveTestDatabaseUrl({
          TEST_DATABASE_URL: `postgresql://u:p@localhost:5432/${name}`,
          DATABASE_URL: devUrl,
        }),
      ).toThrow(/called test or ending in _test/)
    },
  )

  it.each(['test', 'kitchensaver_test'])(
    'accepts the database name %s',
    (name) => {
      const url = `postgresql://u:p@localhost:5432/${name}`
      expect(
        resolveTestDatabaseUrl({
          TEST_DATABASE_URL: url,
          DATABASE_URL: devUrl,
        }),
      ).toBe(url)
    },
  )

  it('rejects a private Railway address', () => {
    expect(() =>
      resolveTestDatabaseUrl({
        TEST_DATABASE_URL:
          'postgresql://u:p@postgres-test.railway.internal:5432/x_test',
      }),
    ).toThrow(/private Railway address/)
  })
})
