import { config } from 'dotenv'
import { configDefaults, defineConfig } from 'vitest/config'

config({ path: ['.env', '../../.env'], quiet: true })

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
          exclude: [...configDefaults.exclude, 'test/db/**'],
          env: {
            DATABASE_URL: 'postgresql://unused:unused@localhost:5432/unused',
          },
        },
      },
      {
        test: {
          name: 'db',
          include: ['test/db/**/*.test.ts'],
          globalSetup: ['test/support/db-global-setup.ts'],
          fileParallelism: false,
          env: { DATABASE_URL: process.env['TEST_DATABASE_URL'] ?? '' },
        },
      },
    ],
  },
})
