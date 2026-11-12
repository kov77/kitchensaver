import { config } from 'dotenv'
import { configDefaults, defineConfig } from 'vitest/config'

config({ path: ['.env', '../../.env'], quiet: true })

const authEnv = {
  AUTH_JWKS_URL: 'https://auth.example.test/.well-known/jwks.json',
  AUTH_ISSUER: 'https://auth.example.test',
  AUTH_AUDIENCE: 'authenticated',
}

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
            ...authEnv,
          },
        },
      },
      {
        test: {
          name: 'db',
          include: ['test/db/**/*.test.ts'],
          globalSetup: ['test/support/db-global-setup.ts'],
          fileParallelism: false,
          env: {
            DATABASE_URL: process.env['TEST_DATABASE_URL'] ?? '',
            ...authEnv,
          },
        },
      },
    ],
  },
})
