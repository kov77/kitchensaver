import { ApiProperty } from '@nestjs/swagger'
import * as zod from 'zod'

import { nameSchema } from '../common/name.schema.js'
import { AllergenCode } from '../generated/prisma/client.js'

const ratingSchema = zod.number().int().min(1).max(5)

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

export class ExclusionDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() ingredientName: string
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date
}

export class PreferenceDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() ingredientName: string
  @ApiProperty({ minimum: 1, maximum: 5 }) rating: number
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date
}
