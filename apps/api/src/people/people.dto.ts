import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

const nameSchema = z.string().trim().min(1).max(80)
const dateOfBirthSchema = z.iso.date()

export const createPersonSchema = z.object({
  name: nameSchema,
  dateOfBirth: dateOfBirthSchema,
})

export const updatePersonSchema = z
  .object({
    name: nameSchema.optional(),
    dateOfBirth: dateOfBirthSchema.optional(),
  })
  .refine(
    ({ name, dateOfBirth }) => name !== undefined || dateOfBirth !== undefined,
    { message: 'Provide name or dateOfBirth' },
  )

export const listPeopleQuerySchema = z.object({
  status: z.enum(['active', 'archived', 'all']).default('active'),
})

export type PeopleStatusFilter = z.infer<typeof listPeopleQuerySchema>['status']

export class CreatePersonRequestDto {
  @ApiProperty({ maxLength: 80 }) name: string
  @ApiProperty({ format: 'date', example: '1990-05-17' }) dateOfBirth: string
}

export class UpdatePersonRequestDto {
  @ApiPropertyOptional({ maxLength: 80 }) name?: string
  @ApiPropertyOptional({ format: 'date' }) dateOfBirth?: string
}

export class ListPeopleQueryDto {
  @ApiPropertyOptional({
    enum: ['active', 'archived', 'all'],
    default: 'active',
  })
  status?: PeopleStatusFilter
}

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
