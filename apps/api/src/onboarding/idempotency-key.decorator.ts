import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import * as zod from 'zod'

import { ApiException } from '../common/api-exception.js'

const idempotencyKeySchema = zod.string().regex(/^[A-Za-z0-9_-]{16,64}$/)

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const { headers } = context.switchToHttp().getRequest<Request>()
    const key = idempotencyKeySchema.safeParse(headers['idempotency-key'])
    if (key.success) return key.data
    throw new ApiException(
      422,
      'IDEMPOTENCY_KEY_INVALID',
      'Send an Idempotency-Key header of 16-64 characters: letters, digits, - and _',
    )
  },
)
