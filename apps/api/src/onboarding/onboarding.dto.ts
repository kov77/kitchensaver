import { ApiProperty } from '@nestjs/swagger'
import * as zod from 'zod'

import { AllergyStatus } from '../generated/prisma/client.js'
import {
  BodyParametersDto,
  bodyParametersSchema,
  NutritionGoalDto,
  saveGoalSchema,
} from '../nutrition-goals/nutrition-goals.dto.js'
import { createPersonSchema, PersonDetailDto } from '../people/people.dto.js'
import {
  MAX_ALLERGIES,
  MAX_EXCLUSIONS,
  MAX_PREFERENCES,
  MIN_ALLERGIES_WHEN_LISTED,
} from '../restrictions/restriction-limits.js'
import {
  allergyRow,
  exclusionRow,
  preferenceRow,
} from '../restrictions/restriction-rows.js'
import {
  addAllergySchema,
  addExclusionSchema,
  addPreferenceSchema,
  AllergyDto,
  ExclusionDto,
  PreferenceDto,
} from '../restrictions/restrictions.dto.js'

function hasUniqueValues(values: string[]) {
  return new Set(values).size === values.length
}

// Duplicates would break the unique indexes halfway through the transaction.
export const onboardingSchema = createPersonSchema.extend({
  bodyParameters: bodyParametersSchema.optional(),
  goal: saveGoalSchema.optional(),
  allergies: zod.discriminatedUnion('status', [
    zod.strictObject({
      status: zod.literal(AllergyStatus.HAS_ALLERGIES),
      items: zod
        .array(addAllergySchema)
        .min(MIN_ALLERGIES_WHEN_LISTED)
        .max(MAX_ALLERGIES)
        .refine((items) =>
          hasUniqueValues(
            items
              .map(allergyRow)
              .map(
                ({ allergenCode, normalizedLabel }) =>
                  `${allergenCode}:${normalizedLabel}`,
              ),
          ),
        ),
    }),
    zod.strictObject({
      status: zod.enum(AllergyStatus).exclude([AllergyStatus.HAS_ALLERGIES]),
      warningAcknowledged: zod.literal(true),
    }),
  ]),
  exclusions: zod
    .array(addExclusionSchema)
    .max(MAX_EXCLUSIONS)
    .refine((exclusions) =>
      hasUniqueValues(
        exclusions
          .map(exclusionRow)
          .map(({ normalizedName }) => normalizedName),
      ),
    )
    .default([]),
  preferences: zod
    .array(addPreferenceSchema)
    .max(MAX_PREFERENCES)
    .refine((preferences) =>
      hasUniqueValues(
        preferences
          .map(preferenceRow)
          .map(({ normalizedName }) => normalizedName),
      ),
    )
    .default([]),
})

export type OnboardingRequest = zod.infer<typeof onboardingSchema>

export class OnboardingDto {
  @ApiProperty({ type: PersonDetailDto }) person: PersonDetailDto
  @ApiProperty({ type: NutritionGoalDto, nullable: true })
  goal: NutritionGoalDto | null
  @ApiProperty({ type: BodyParametersDto, nullable: true })
  bodyParameters: BodyParametersDto | null
  @ApiProperty({ type: AllergyDto, isArray: true }) allergies: AllergyDto[]
  @ApiProperty({ type: ExclusionDto, isArray: true })
  exclusions: ExclusionDto[]
  @ApiProperty({ type: PreferenceDto, isArray: true })
  preferences: PreferenceDto[]
}
