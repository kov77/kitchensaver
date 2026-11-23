import * as zod from 'zod'

import { lazyMessage } from './messages'

export const choice = <Value extends string>(values: readonly Value[]) =>
  zod
    .custom<Value | null>(
      (input) => input === null || values.some((value) => value === input),
    )
    .refine((value) => value !== null, lazyMessage('common:errors-choose'))
