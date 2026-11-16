import { ApiProperty } from '@nestjs/swagger'
import * as zod from 'zod'

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
  allergies: zod
    .array(addAllergySchema)
    .max(MAX_ALLERGIES)
    .refine((allergies) =>
      hasUniqueValues(
        allergies
          .map(allergyRow)
          .map(
            ({ allergenCode, normalizedLabel }) =>
              `${allergenCode}:${normalizedLabel}`,
          ),
      ),
    )
    .default([]),
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
