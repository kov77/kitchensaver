import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'

import {
  createRateLimitOptions,
  DEFAULT_RATE_LIMITS,
} from './rate-limit.options.js'
import { RateLimitGuard } from './rate-limit.guard.js'

@Module({
  imports: [
    ThrottlerModule.forRoot(createRateLimitOptions(DEFAULT_RATE_LIMITS)),
  ],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class RateLimitModule {}
