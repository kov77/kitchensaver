import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

import { ConsentCategory } from '../generated/prisma/client.js'

export const recordConsentsSchema = z.object({
  adultConfirmed: z.boolean(),
  acceptTerms: z.boolean(),
  acknowledgePrivacy: z.boolean(),
  termsVersion: z.string().min(1).max(64),
  privacyVersion: z.string().min(1).max(64),
})

export class RecordConsentsRequestDto {
  @ApiProperty() adultConfirmed: boolean
  @ApiProperty() acceptTerms: boolean
  @ApiProperty() acknowledgePrivacy: boolean
  @ApiProperty() termsVersion: string
  @ApiProperty() privacyVersion: string
}

export class LegalVersionsDto {
  @ApiProperty() adultAttestationVersion: string
  @ApiProperty() termsVersion: string
  @ApiProperty() privacyVersion: string
}

export class OnboardingStatusDto {
  @ApiProperty() complete: boolean
  @ApiProperty({ enum: ConsentCategory, isArray: true })
  missing: ConsentCategory[]
  @ApiProperty({ type: LegalVersionsDto }) currentVersions: LegalVersionsDto
}
