import { ApiProperty } from '@nestjs/swagger'
import * as zod from 'zod'

import {
  ActivityLevel,
  CalculationMethod,
  FormulaSex,
  GoalMode,
  GoalType,
} from '../generated/prisma/client.js'
import { dateOfBirthSchema } from '../people/people.dto.js'

// Input-sanity limits, not medical thresholds (D031).
const heightCmSchema = zod.number().min(90).max(250)
const weightKgSchema = zod.number().min(20).max(400)
const dailyKcalSchema = zod.number().int().min(500).max(10_000)
const macroGramsSchema = zod.number().int().min(0).max(2000)

export const bodyParametersSchema = zod.strictObject({
  heightCm: heightCmSchema,
  weightKg: weightKgSchema,
  activityLevel: zod.enum(ActivityLevel),
  formulaSex: zod.enum(FormulaSex),
})

// CUSTOM has no formula, so it exists only for manual goals.
const estimatedGoalTypeSchema = zod.enum(['LOSE', 'MAINTAIN', 'GAIN'])

// Any body parameter left out is taken from the stored ones.
const optionalBodyParametersSchema = bodyParametersSchema.partial()

export const estimateGoalSchema = optionalBodyParametersSchema.extend({
  goalType: estimatedGoalTypeSchema,
})

// Onboarding preview: no profile exists yet, so every input comes in the body.
export const previewGoalSchema = bodyParametersSchema.extend({
  dateOfBirth: dateOfBirthSchema,
  goalType: estimatedGoalTypeSchema,
})

const goalFieldsShape = {
  dailyKcal: dailyKcalSchema,
  proteinG: macroGramsSchema.optional(),
  fatG: macroGramsSchema.optional(),
  carbsG: macroGramsSchema.optional(),
  confirmMacroMismatch: zod.boolean().optional(),
}

export const saveGoalSchema = zod.discriminatedUnion('mode', [
  zod.strictObject({
    mode: zod.literal(GoalMode.MANUAL),
    goalType: zod.enum(GoalType).default(GoalType.CUSTOM),
    ...goalFieldsShape,
  }),
  optionalBodyParametersSchema.extend({
    mode: zod.literal(GoalMode.ESTIMATED),
    goalType: estimatedGoalTypeSchema,
    ...goalFieldsShape,
  }),
])

export type BodyParametersRequest = zod.infer<typeof bodyParametersSchema>
export type EstimateGoalRequest = zod.infer<typeof estimateGoalSchema>
export type PreviewGoalRequest = zod.infer<typeof previewGoalSchema>
export type SaveGoalRequest = zod.infer<typeof saveGoalSchema>

export class BodyParametersDto {
  @ApiProperty() heightCm: number
  @ApiProperty() weightKg: number
  @ApiProperty({ enum: ActivityLevel }) activityLevel: ActivityLevel
  @ApiProperty({ enum: FormulaSex }) formulaSex: FormulaSex
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: Date
}

export class MacroWarningDto {
  @ApiProperty({ enum: ['MACROS_ENERGY_MISMATCH'] }) code: string
  @ApiProperty() calculatedKcal: number
  @ApiProperty() dailyKcal: number
}

export class NutritionGoalDto {
  @ApiProperty({ enum: GoalMode }) mode: GoalMode
  @ApiProperty({ enum: GoalType }) goalType: GoalType
  @ApiProperty() dailyKcal: number
  @ApiProperty({ type: Number, nullable: true }) proteinG: number | null
  @ApiProperty({ type: Number, nullable: true }) fatG: number | null
  @ApiProperty({ type: Number, nullable: true }) carbsG: number | null
  @ApiProperty({ type: Number, nullable: true })
  estimatedMaintenanceKcal: number | null
  @ApiProperty({ enum: CalculationMethod, nullable: true })
  calculationMethod: CalculationMethod | null
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  estimatedAt: Date | null
  @ApiProperty() revision: number
  @ApiProperty({ type: String, format: 'date-time' }) confirmedAt: Date
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  reviewRequiredAt: Date | null
  @ApiProperty({ enum: ['OK', 'MISMATCH_CONFIRMED', 'SKIPPED_INCOMPLETE'] })
  macroCheck: string
  @ApiProperty({ type: MacroWarningDto, isArray: true })
  warnings: MacroWarningDto[]
}

export class ProposedMacrosDto {
  @ApiProperty() proteinG: number
  @ApiProperty() fatG: number
  @ApiProperty() carbsG: number
}

export class GoalEstimateDto {
  @ApiProperty() estimatedMaintenanceKcal: number
  @ApiProperty({ type: ProposedMacrosDto, nullable: true })
  proposedMacros: ProposedMacrosDto | null
  @ApiProperty({ enum: CalculationMethod })
  calculationMethod: CalculationMethod
  @ApiProperty() methodology: string
  @ApiProperty({ type: String, isArray: true }) assumptions: string[]
  @ApiProperty({ enum: [true] }) isEstimate: true
}
