import {
  DAILY_KCAL_ISSUES,
  type DailyKcalIssue,
  type GoalPace,
  GOAL_PACES,
} from '@kitchensaver/nutrition'
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

const estimatedGoalTypeSchema = zod.enum(['LOSE', 'MAINTAIN', 'GAIN'])

const optionalBodyParametersSchema = bodyParametersSchema.partial()

export const estimateGoalSchema = optionalBodyParametersSchema.extend({
  goalType: estimatedGoalTypeSchema,
})

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
  confirmKcalWarning: zod.boolean().optional(),
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

export class KcalLimitsDto {
  @ApiProperty() blockedMinimum: number
  @ApiProperty() advisedMinimum: number
  @ApiProperty() advisedMaximum: number
  @ApiProperty() advisedMaximumDeficit: number
  @ApiProperty() advisedMaximumSurplus: number
}

export class KcalWarningDto {
  @ApiProperty({ enum: DAILY_KCAL_ISSUES, isArray: true })
  issues: DailyKcalIssue[]
  @ApiProperty() dailyKcal: number
  @ApiProperty({ type: Number, nullable: true }) maintenanceKcal: number | null
  @ApiProperty({ type: KcalLimitsDto }) limits: KcalLimitsDto
}

export class KcalSuggestionDto {
  @ApiProperty({ enum: GOAL_PACES }) pace: GoalPace
  @ApiProperty() suggestedKcal: number
  @ApiProperty() adjustmentKcal: number
  @ApiProperty() isLimited: boolean
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
  @ApiProperty({ type: KcalWarningDto, nullable: true })
  kcalWarning: KcalWarningDto | null
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
  @ApiProperty({ type: KcalSuggestionDto, isArray: true })
  kcalSuggestions: KcalSuggestionDto[]
  @ApiProperty({ enum: [true] }) isEstimate: true
}
