import * as zod from 'zod'

const envSchema = zod.object({
  EXPO_PUBLIC_API_URL: zod.url(),
  EXPO_PUBLIC_SUPABASE_URL: zod.url({ protocol: /^https$/ }),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: zod.string().min(1),
})

export type Env = zod.infer<typeof envSchema>

export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const problems = result.error.issues
      .map(({ path, message }) => `${path.join('.')}: ${message}`)
      .join('; ')
    throw new Error(`Invalid app configuration: ${problems}`)
  }
  return result.data
}
