import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { AllowWithoutConsent } from './allow-without-consent.decorator.js'
import {
  OnboardingStatusDto,
  RecordConsentsRequestDto,
  recordConsentsSchema,
} from './consent.dto.js'
import { ConsentService } from './consent.service.js'

@ApiTags('me')
@ApiBearerAuth()
@Controller('me/consents')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @AllowWithoutConsent()
  @HttpCode(200)
  @ApiOkResponse({ type: OnboardingStatusDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiUnprocessableEntityResponse({
    description:
      'ADULT_CONFIRMATION_REQUIRED, TERMS_NOT_ACCEPTED, PRIVACY_NOT_ACKNOWLEDGED, LEGAL_VERSION_NOT_CURRENT or VALIDATION_FAILED',
  })
  record(
    @CurrentAccount() accountId: string,
    @Body({ schema: recordConsentsSchema }) body: RecordConsentsRequestDto,
  ) {
    return this.consentService.recordConsents(accountId, body)
  }
}
