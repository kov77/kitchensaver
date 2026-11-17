import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import * as zod from 'zod'

import { ApiException } from '../common/api-exception.js'

const KEY_MIN_LENGTH = 16
const KEY_MAX_LENGTH = 64

const idempotencyKeySchema = zod
  .string()
  .min(KEY_MIN_LENGTH)
  .max(KEY_MAX_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/)

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const { headers } = context.switchToHttp().getRequest<Request>()
    const key = idempotencyKeySchema.safeParse(headers['idempotency-key'])
    if (key.success) return key.data
    throw new ApiException(
      422,
      'IDEMPOTENCY_KEY_INVALID',
      `Send an Idempotency-Key header of ${KEY_MIN_LENGTH}-${KEY_MAX_LENGTH} characters: letters, digits, - and _`,
    )
  },
)
