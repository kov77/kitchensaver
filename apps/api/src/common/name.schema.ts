import * as zod from 'zod'

const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 80

export const nameSchema = zod
  .string()
  .trim()
  .min(NAME_MIN_LENGTH)
  .max(NAME_MAX_LENGTH)
  .refine((value) => !value.includes('\0'), {
    message: 'Must not contain a NUL character',
  })
