import * as zod from 'zod'

import { REQUIRED_MESSAGE, lazyMessage } from '@/utils/messages'
import { requiredText } from '@/utils/schemas'

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './constants'

const emailSchema = requiredText.pipe(
  zod.email(lazyMessage('auth:field-errors-invalid-email')),
)

export const signInSchema = zod.object({
  email: emailSchema,
  password: zod.string().min(1, REQUIRED_MESSAGE),
})

export const signUpSchema = zod.object({
  email: emailSchema,
  password: zod
    .string()
    .min(1, REQUIRED_MESSAGE)
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
