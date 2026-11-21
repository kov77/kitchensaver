import * as zod from 'zod'

import { lazyMessage } from '@/utils/messages'

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './constants'

const emailSchema = zod
  .string()
  .trim()
  .pipe(zod.email(lazyMessage('auth:field-errors-invalid-email')))

export const signInSchema = zod.object({
  email: emailSchema,
  password: zod
    .string()
    .min(1, lazyMessage('auth:field-errors-password-required')),
})

export const signUpSchema = zod.object({
  email: emailSchema,
  password: zod
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      lazyMessage('auth:field-errors-password-too-short', {
        min: PASSWORD_MIN_LENGTH,
      }),
    )
    .max(
      PASSWORD_MAX_LENGTH,
      lazyMessage('auth:field-errors-password-too-long', {
        max: PASSWORD_MAX_LENGTH,
      }),
    ),
})

export type SignInValues = zod.infer<typeof signInSchema>
export type SignUpValues = zod.infer<typeof signUpSchema>
