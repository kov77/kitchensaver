import { Controller, Get } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { AllowWithoutConsent } from '../consent/allow-without-consent.decorator.js'
import { ConsentService } from '../consent/consent.service.js'
import { MeResponseDto } from './me.dto.js'

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly consentService: ConsentService) {}

  @Get()
  @AllowWithoutConsent()
  @ApiOkResponse({
    type: MeResponseDto,
    description: 'The current account and its onboarding status',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async get(@CurrentAccount() accountId: string): Promise<MeResponseDto> {
    return {
      id: accountId,
      onboarding: await this.consentService.getOnboardingStatus(accountId),
    }
  }
}
