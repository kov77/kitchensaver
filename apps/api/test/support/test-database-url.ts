export function resolveTestDatabaseUrl(env: NodeJS.ProcessEnv): string {
  const testUrl = env['TEST_DATABASE_URL']
  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL is required for database tests')
  }
  if (testUrl === env['DATABASE_URL']) {
    throw new Error(
      'TEST_DATABASE_URL must not point to the same database as DATABASE_URL',
    )
  }
  // The run empties every table, so only a database named for testing is accepted.
  if (!/(^|_)test$/.test(new URL(testUrl).pathname.slice(1))) {
    throw new Error(
      'TEST_DATABASE_URL must name a database called test or ending in _test',
    )
  }
  if (new URL(testUrl).hostname.endsWith('.railway.internal')) {
    throw new Error(
      'TEST_DATABASE_URL is a private Railway address; use the DATABASE_PUBLIC_URL of the test database',
    )
  }
  return testUrl
}
