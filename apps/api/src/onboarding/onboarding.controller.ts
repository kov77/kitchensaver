import { Body, Controller, Post } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { IdempotencyKey } from './idempotency-key.decorator.js'
import {
  OnboardingDto,
  type OnboardingRequest,
  onboardingSchema,
} from './onboarding.dto.js'
import { OnboardingService } from './onboarding.service.js'

@ApiTags('people')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@Controller('people')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post('onboarding')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      '16-64 characters (letters, digits, - and _), one key per onboarding attempt; a repeat within 24 hours returns the first result',
  })
  @ApiCreatedResponse({ type: OnboardingDto })
  @ApiConflictResponse({
    description: 'PROFILE_LIMIT_REACHED or IDEMPOTENCY_KEY_REUSED',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'IDEMPOTENCY_KEY_INVALID, PERSON_AGE_NOT_SUPPORTED, goal errors (see PUT /people/:id/goal) or VALIDATION_FAILED',
  })
  onboard(
    @CurrentAccount() accountId: string,
    @IdempotencyKey() idempotencyKey: string,
    @Body({ schema: onboardingSchema }) body: OnboardingRequest,
  ) {
    return this.onboarding.onboard(accountId, idempotencyKey, body)
  }
}
