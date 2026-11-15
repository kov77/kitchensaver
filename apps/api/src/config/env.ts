import * as zod from 'zod'

const envSchema = zod.object({
  NODE_ENV: zod
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: zod.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: zod.url({ protocol: /^postgres(ql)?$/ }),
  AUTH_JWKS_URL: zod.url({ protocol: /^https$/ }),
  AUTH_ISSUER: zod.string().min(1),
  AUTH_AUDIENCE: zod.string().min(1),
})

export type Env = zod.infer<typeof envSchema>

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
