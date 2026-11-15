import { spawnSync } from 'node:child_process'

import { createCleanerClient, truncateAllTables } from './clean-database.js'
import { resolveTestDatabaseUrl } from './test-database-url.js'

async function emptyDatabase(connectionString: string) {
  const cleaner = createCleanerClient(connectionString)
  try {
    await truncateAllTables(cleaner)
  } finally {
    await cleaner.$disconnect()
  }
}

export default async function setup() {
  const testUrl = resolveTestDatabaseUrl(process.env)
  const result = spawnSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: testUrl },
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(
      `Applying migrations to the test database failed:\n${result.stdout}${result.stderr}`,
    )
  }

  // Leftovers of a run that was killed before its teardown.
  await emptyDatabase(testUrl)

  return () => emptyDatabase(testUrl)
}
