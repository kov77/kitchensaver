import { type ExecutionContext, Injectable } from '@nestjs/common'
import { type ThrottlerLimitDetail, ThrottlerGuard } from '@nestjs/throttler'

import { IS_PUBLIC_KEY } from '../auth/public.decorator.js'
import { ApiException } from '../common/api-exception.js'

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected override async shouldSkip(context: ExecutionContext) {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    )
  }

  protected override async throwThrottlingException(
    context: ExecutionContext,
    { timeToBlockExpire }: ThrottlerLimitDetail,
  ): Promise<void> {
    const { res } = this.getRequestResponse(context)
    this.setResponseHeader(res, 'Retry-After', timeToBlockExpire)
    throw new ApiException(
      429,
      'RATE_LIMITED',
      'Too many requests; try again later',
      { retryAfterSeconds: timeToBlockExpire },
    )
  }
}
