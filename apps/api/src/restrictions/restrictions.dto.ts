import { ApiProperty } from '@nestjs/swagger'
import * as zod from 'zod'

import { nameSchema } from '../common/name.schema.js'
import { AllergenCode, AllergyStatus } from '../generated/prisma/client.js'
import { MAX_RATING, MIN_RATING } from './restriction-limits.js'

const ratingSchema = zod.number().int().min(MIN_RATING).max(MAX_RATING)

// Only OTHER carries a label; the strict schemas reject one on any other code.
export const addAllergySchema = zod.discriminatedUnion('allergenCode', [
  zod.strictObject({
    allergenCode: zod.literal(AllergenCode.OTHER),
    customLabel: nameSchema,
  }),
  zod.strictObject({
    allergenCode: zod.enum(AllergenCode).exclude([AllergenCode.OTHER]),
  }),
])

// HAS_ALLERGIES is set by adding an allergy, never directly.
export const setAllergyStatusSchema = zod.strictObject({
  status: zod.enum(AllergyStatus).exclude([AllergyStatus.HAS_ALLERGIES]),
  warningAcknowledged: zod.literal(true),
})

export const updateAllergySchema = zod.strictObject({
  customLabel: nameSchema,
})

export const addExclusionSchema = zod.strictObject({
  ingredientName: nameSchema,
})

export const addPreferenceSchema = zod.strictObject({
  ingredientName: nameSchema,
  rating: ratingSchema,
})

export const updatePreferenceSchema = zod.strictObject({
  rating: ratingSchema,
})

export type AddAllergyRequest = zod.infer<typeof addAllergySchema>
export type SetAllergyStatusRequest = zod.infer<typeof setAllergyStatusSchema>
export type UpdateAllergyRequest = zod.infer<typeof updateAllergySchema>
export type AddExclusionRequest = zod.infer<typeof addExclusionSchema>
export type AddPreferenceRequest = zod.infer<typeof addPreferenceSchema>
export type UpdatePreferenceRequest = zod.infer<typeof updatePreferenceSchema>

export class AllergyDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty({ enum: AllergenCode }) allergenCode: AllergenCode
  @ApiProperty({ type: String, nullable: true }) customLabel: string | null
  @ApiProperty({
    description: 'False for OTHER: the allergen is not mapped to a known code',
  })
  resolved: boolean
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date
}

export class AllergyStatusDto {
  @ApiProperty({ enum: AllergyStatus }) allergyStatus: AllergyStatus
  @ApiProperty({ type: String, format: 'date-time' }) allergyStatusAt: Date
}

export class ExclusionDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() ingredientName: string
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date
}

export class PreferenceDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() ingredientName: string
  @ApiProperty({ minimum: MIN_RATING, maximum: MAX_RATING }) rating: number
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date
}
