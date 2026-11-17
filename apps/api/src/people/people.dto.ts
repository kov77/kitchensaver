import { ApiProperty } from '@nestjs/swagger'
import * as zod from 'zod'

import { nameSchema } from '../common/name.schema.js'
import {
  AllergyStatus,
  GoalMode,
  GoalType,
} from '../generated/prisma/client.js'

export const dateOfBirthSchema = zod.iso.date()

export const createPersonSchema = zod.strictObject({
  name: nameSchema,
  dateOfBirth: dateOfBirthSchema,
})

export const updatePersonSchema = zod
  .strictObject({
    name: nameSchema.optional(),
    dateOfBirth: dateOfBirthSchema.optional(),
  })
  .refine(
    ({ name, dateOfBirth }) => name !== undefined || dateOfBirth !== undefined,
    { message: 'Provide name or dateOfBirth' },
  )

export const listPeopleQuerySchema = zod.object({
  status: zod.enum(['active', 'archived', 'all']).default('active'),
})

export type CreatePersonRequest = zod.infer<typeof createPersonSchema>
export type UpdatePersonRequest = zod.infer<typeof updatePersonSchema>
export type ListPeopleQuery = zod.infer<typeof listPeopleQuerySchema>

export class GoalSummaryDto {
  @ApiProperty({ enum: GoalMode }) mode: GoalMode
  @ApiProperty() dailyKcal: number
  @ApiProperty({ enum: GoalType }) goalType: GoalType
}

export class PlanReadinessDto {
  @ApiProperty() ready: boolean
  @ApiProperty({
    enum: [
      'MISSING_GOAL',
      'GOAL_REVIEW_REQUIRED',
      'GOAL_NOT_VALID_FOR_AGE',
      'ALLERGY_STATUS_MISSING',
    ],
    isArray: true,
  })
  reasons: string[]
}

export class PersonListItemDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() name: string
  @ApiProperty() age: number
  @ApiProperty({ type: GoalSummaryDto, nullable: true })
  goal: GoalSummaryDto | null
  @ApiProperty({ type: PlanReadinessDto }) planReadiness: PlanReadinessDto
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  archivedAt: string | null
}

export class PersonCapabilitiesDto {
  @ApiProperty() goalEstimation: boolean
}

export class PersonDetailDto extends PersonListItemDto {
  @ApiProperty({ format: 'date' }) dateOfBirth: string
  @ApiProperty({
    enum: AllergyStatus,
    nullable: true,
    description: 'null until the allergy question is answered',
  })
  allergyStatus: AllergyStatus | null
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  allergyStatusAt: string | null
  @ApiProperty({ type: PersonCapabilitiesDto })
  capabilities: PersonCapabilitiesDto
  @ApiProperty({ format: 'date-time' }) createdAt: string
}
