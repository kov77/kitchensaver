import { ApiProperty } from '@nestjs/swagger'

import { OnboardingStatusDto } from '../consent/consent.dto.js'

export class MeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ type: OnboardingStatusDto })
  onboarding: OnboardingStatusDto
}
