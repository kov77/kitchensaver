import * as zod from 'zod'

import { REQUIRED_MESSAGE } from './messages'

export const requiredText = zod.string().trim().min(1, REQUIRED_MESSAGE)

export const choice = <Value extends string>(values: readonly Value[]) =>
  zod
    .custom<Value | null>(
      (input) => input === null || values.some((value) => value === input),
    )
    .refine((value) => value !== null, REQUIRED_MESSAGE)
