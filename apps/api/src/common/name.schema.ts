import * as zod from 'zod'

// A NUL character cannot be stored in a PostgreSQL text column; reject it here instead of failing with a 500.
export const nameSchema = zod
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((value) => !value.includes('\0'), {
    message: 'Must not contain a NUL character',
  })
