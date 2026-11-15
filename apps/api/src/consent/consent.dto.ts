import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

import { ConsentCategory } from '../generated/prisma/client.js'

const versionSchema = z.string().min(1).max(64)

export const recordConsentsSchema = z.object({
  adultConfirmed: z.boolean(),
  acceptTerms: z.boolean(),
  acknowledgePrivacy: z.boolean(),
  termsVersion: versionSchema,
  privacyVersion: versionSchema,
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
