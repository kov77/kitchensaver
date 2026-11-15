import { ApiProperty } from '@nestjs/swagger'
import * as zod from 'zod'

import { ConsentCategory } from '../generated/prisma/client.js'

const versionSchema = zod.string().min(1).max(64)

export const recordConsentsSchema = zod.strictObject({
  adultConfirmed: zod.boolean(),
  acceptTerms: zod.boolean(),
  acknowledgePrivacy: zod.boolean(),
  termsVersion: versionSchema,
  privacyVersion: versionSchema,
})

export type RecordConsentsRequest = zod.infer<typeof recordConsentsSchema>

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
