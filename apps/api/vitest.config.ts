import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgresql://unused:unused@localhost:5432/unused',
    },
  },
})
