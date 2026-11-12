import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  AUTH_JWKS_URL: z.url({ protocol: /^https$/ }),
  AUTH_ISSUER: z.string().min(1),
  AUTH_AUDIENCE: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw)
  if (!result.success) {
    const problems = result.error.issues
      .map(({ path, message }) => `${path.join('.')}: ${message}`)
      .join('; ')
    throw new Error(`Invalid environment configuration: ${problems}`)
  }
  return result.data
}
