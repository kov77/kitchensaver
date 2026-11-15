import { ApiProperty } from '@nestjs/swagger'
import * as zod from 'zod'

const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 80

const nameSchema = zod.string().trim().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH)
const dateOfBirthSchema = zod.iso.date()

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

export class PersonListItemDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() name: string
  @ApiProperty() age: number
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  archivedAt: string | null
}

export class PersonCapabilitiesDto {
  @ApiProperty() goalEstimation: boolean
}

export class PersonDetailDto extends PersonListItemDto {
  @ApiProperty({ format: 'date' }) dateOfBirth: string
  @ApiProperty({ type: PersonCapabilitiesDto })
  capabilities: PersonCapabilitiesDto
  @ApiProperty({ format: 'date-time' }) createdAt: string
}
