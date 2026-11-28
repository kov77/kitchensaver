import { compareMacroEnergy } from '@kitchensaver/nutrition'
import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { hasPrismaCode } from '../common/prisma-errors.js'
import type { Prisma } from '../generated/prisma/client.js'
import { calculateAge } from '../people/age.js'
import { parseSupportedDateOfBirth } from '../people/date-of-birth.js'
import { personNotFound } from '../people/people.errors.js'
import { PeopleService } from '../people/people.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  buildGoalFields,
  checkDailyKcal,
  maintenanceKcalFor,
  previewEstimate,
} from './goal-calculation.js'
import type {
  EstimateGoalRequest,
  GoalEstimateDto,
  NutritionGoalDto,
  PreviewGoalRequest,
  SaveGoalRequest,
} from './nutrition-goals.dto.js'

const bodyParametersSelect = {
  heightCm: true,
  weightKg: true,
  activityLevel: true,
  formulaSex: true,
} as const

const goalSelect = {
  mode: true,
  goalType: true,
  dailyKcal: true,
  proteinG: true,
  fatG: true,
  carbsG: true,
  estimatedMaintenanceKcal: true,
  calculationMethod: true,
  estimatedAt: true,
  revision: true,
  confirmedAt: true,
  reviewRequiredAt: true,
  personProfile: {
    select: {
      dateOfBirth: true,
      bodyParameters: { select: bodyParametersSelect },
    },
  },
} as const

type StoredGoal = Prisma.NutritionGoalGetPayload<{ select: typeof goalSelect }>

type GoalFields = Omit<StoredGoal, 'personProfile'>

function checkMacros({ dailyKcal, proteinG, fatG, carbsG }: GoalFields) {
  if (proteinG === null || fatG === null || carbsG === null) {
    return { macroCheck: 'SKIPPED_INCOMPLETE', warnings: [] }
  }
  const { calculatedKcal, isMismatch } = compareMacroEnergy(dailyKcal, {
    proteinG,
    fatG,
    carbsG,
  })
  if (!isMismatch) return { macroCheck: 'OK', warnings: [] }
  return {
    macroCheck: 'MISMATCH_CONFIRMED',
    warnings: [{ code: 'MACROS_ENERGY_MISMATCH', calculatedKcal, dailyKcal }],
  }
}

function toGoalDto({ personProfile, ...goal }: StoredGoal): NutritionGoalDto {
  const { dateOfBirth, bodyParameters } = personProfile
  const maintenanceKcal =
    goal.estimatedMaintenanceKcal ??
    maintenanceKcalFor(calculateAge(dateOfBirth, new Date()), bodyParameters)
  return {
    ...goal,
    ...checkMacros(goal),
    kcalWarning: checkDailyKcal(goal.dailyKcal, maintenanceKcal),
  }
}

@Injectable()
export class NutritionGoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: PeopleService,
  ) {}

  async get(accountId: string, personId: string): Promise<NutritionGoalDto> {
    await this.people.assertExists(accountId, personId)
    const goal = await this.find(personId)
    if (!goal) {
      throw new ApiException(404, 'GOAL_NOT_FOUND', 'No goal is set')
    }
    return goal
  }

  async find(personId: string): Promise<NutritionGoalDto | null> {
    const goal = await this.prisma.nutritionGoal.findUnique({
      where: { personProfileId: personId },
      select: goalSelect,
    })
    return goal && toGoalDto(goal)
  }

  async estimate(
    accountId: string,
    personId: string,
    request: EstimateGoalRequest,
  ): Promise<GoalEstimateDto> {
    const ageYears = await this.getAge(accountId, personId)
    const stored = await this.getBodyParameters(personId)
    return previewEstimate(ageYears, request, stored)
  }

  estimateForDateOfBirth({
    dateOfBirth: isoDateOfBirth,
    ...request
  }: PreviewGoalRequest): GoalEstimateDto {
    const dateOfBirth = parseSupportedDateOfBirth(isoDateOfBirth)
    return previewEstimate(calculateAge(dateOfBirth, new Date()), request, null)
  }

  async save(
    accountId: string,
    personId: string,
    request: SaveGoalRequest,
  ): Promise<NutritionGoalDto> {
    const ageYears = await this.getAge(accountId, personId)
    const stored = await this.getBodyParameters(personId)
    const fields = buildGoalFields(request, ageYears, stored, new Date())
    try {
      const goal = await this.prisma.nutritionGoal.upsert({
        where: { personProfileId: personId },
        create: { personProfileId: personId, ...fields },
        update: { ...fields, revision: { increment: 1 } },
        select: goalSelect,
      })
      return toGoalDto(goal)
    } catch (error) {
      if (hasPrismaCode(error, 'P2003')) throw personNotFound()
      throw error
    }
  }

  private async getAge(accountId: string, personId: string) {
    const dateOfBirth = await this.people.getDateOfBirth(accountId, personId)
    return calculateAge(dateOfBirth, new Date())
  }

  private getBodyParameters(personId: string) {
    return this.prisma.personBodyParameters.findUnique({
      where: { personProfileId: personId },
      select: bodyParametersSelect,
    })
  }
}
