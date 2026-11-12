import { spawnSync } from 'node:child_process'

import { resolveTestDatabaseUrl } from './test-database-url.js'

export default function setup() {
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
}
