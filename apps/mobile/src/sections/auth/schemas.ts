import * as zod from 'zod'

import {
  FIELD_ERROR_MESSAGES,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './constants'

const emailSchema = zod
  .string()
  .trim()
  .pipe(zod.email(FIELD_ERROR_MESSAGES.invalidEmail))

export const signInSchema = zod.object({
  email: emailSchema,
  password: zod.string().min(1, FIELD_ERROR_MESSAGES.passwordRequired),
})

export const signUpSchema = zod.object({
  email: emailSchema,
  password: zod
    .string()
    .min(PASSWORD_MIN_LENGTH, FIELD_ERROR_MESSAGES.passwordTooShort)
    .max(PASSWORD_MAX_LENGTH, FIELD_ERROR_MESSAGES.passwordTooLong),
})

export type SignInValues = zod.infer<typeof signInSchema>
export type SignUpValues = zod.infer<typeof signUpSchema>
