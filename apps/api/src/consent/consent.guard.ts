import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ApiException } from '../common/api-exception.js'
import { IS_PUBLIC_KEY } from '../auth/public.decorator.js'
import type { AuthenticatedRequest } from '../auth/authenticated-request.js'
import { ALLOW_WITHOUT_CONSENT_KEY } from './allow-without-consent.decorator.js'
import { ConsentService } from './consent.service.js'

@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly consentService: ConsentService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()]
    const isExempt = [IS_PUBLIC_KEY, ALLOW_WITHOUT_CONSENT_KEY].some((key) =>
      this.reflector.getAllAndOverride<boolean | undefined>(key, targets),
    )
    if (isExempt) return true

    const { accountId } = context
      .switchToHttp()
      .getRequest<Partial<AuthenticatedRequest>>()
    if (!accountId) throw new UnauthorizedException()

    const { complete, missing } =
      await this.consentService.getOnboardingStatus(accountId)
    if (complete) return true
    throw new ApiException(
      403,
      'CONSENT_REQUIRED',
      'Complete the onboarding confirmations to continue',
      { missing },
    )
  }
}
