import { type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { ThrottlerModuleOptions } from '@nestjs/throttler'

import { STRICT_RATE_LIMIT_KEY } from './strict-rate-limit.decorator.js'

export interface RateLimits {
  requestsPerMinute: number
  strictRequestsPerMinute: number
}

export const DEFAULT_RATE_LIMITS: RateLimits = {
  requestsPerMinute: 100,
  strictRequestsPerMinute: 5,
}

const WINDOW_MS = 60_000

const reflector = new Reflector()

function isStrictRoute(context: ExecutionContext) {
  return reflector.getAllAndOverride<boolean | undefined>(
    STRICT_RATE_LIMIT_KEY,
    [context.getHandler(), context.getClass()],
  )
}

export function createRateLimitOptions({
  requestsPerMinute,
  strictRequestsPerMinute,
}: RateLimits): ThrottlerModuleOptions {
  return {
    setHeaders: false,
    getTracker: ({ accountId }) => accountId,
    throttlers: [
      {
        name: 'account',
        ttl: WINDOW_MS,
        limit: requestsPerMinute,

        generateKey: (_context, accountId, name) => `${name}-${accountId}`,
      },
      {
        name: 'strict',
        ttl: WINDOW_MS,
        limit: strictRequestsPerMinute,
        skipIf: (context) => !isStrictRoute(context),
      },
    ],
  }
}
