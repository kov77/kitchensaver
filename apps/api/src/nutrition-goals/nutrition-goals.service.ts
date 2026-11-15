import {
  compareMacroEnergy,
  estimateMaintenanceEnergy,
  isGoalTypeAllowedForAge,
  type GoalType,
  type Macros,
  suggestMacros,
} from '@kitchensaver/nutrition'
import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import type { Prisma } from '../generated/prisma/client.js'
import { calculateAge } from '../people/age.js'
import { PeopleService } from '../people/people.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type {
  EstimateGoalRequest,
  GoalEstimateDto,
  NutritionGoalDto,
  SaveGoalRequest,
} from './nutrition-goals.dto.js'

const METHODOLOGY =
  'Dietary Reference Intakes for Energy, National Academies, 2023 (doi:10.17226/26818)'

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
} as const

type StoredGoal = Prisma.NutritionGoalGetPayload<{ select: typeof goalSelect }>

// The mismatch warning is recomputed on every read; only the user's confirmation is stored (D031).
function checkMacros({ dailyKcal, proteinG, fatG, carbsG }: StoredGoal) {
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

@Injectable()
export class NutritionGoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: PeopleService,
  ) {}

  async get(accountId: string, personId: string): Promise<NutritionGoalDto> {
    await this.people.assertExists(accountId, personId)
    const goal = await this.prisma.nutritionGoal.findUnique({
      where: { personProfileId: personId },
      select: goalSelect,
    })
    if (!goal) {
      throw new ApiException(404, 'GOAL_NOT_FOUND', 'No goal is set')
    }
    return { ...goal, ...checkMacros(goal) }
  }

  async estimate(
    accountId: string,
    personId: string,
    request: EstimateGoalRequest,
  ): Promise<GoalEstimateDto> {
    const ageYears = await this.getAge(accountId, personId)
    assertGoalTypeAllowed(request.goalType, ageYears)
    const { maintenanceKcal, method } = await this.computeEstimate(
      personId,
      ageYears,
      request,
    )
    return {
      estimatedMaintenanceKcal: maintenanceKcal,
      proposedMacros: suggestMacros(maintenanceKcal, ageYears),
      calculationMethod: method,
      methodology: METHODOLOGY,
      assumptions: [
        'AGE_IN_COMPLETED_YEARS',
        'MAINTENANCE_ENERGY_NOT_A_TARGET',
        'LARGE_INDIVIDUAL_VARIATION',
        method === 'DRI_2023_ADULT'
          ? 'ADULT_EQUATIONS_APPLIED_AT_ALL_AGES'
          : 'INCLUDES_GROWTH_ALLOWANCE',
      ],
      isEstimate: true,
    }
  }

  async save(
    accountId: string,
    personId: string,
    request: SaveGoalRequest,
  ): Promise<NutritionGoalDto> {
    const ageYears = await this.getAge(accountId, personId)
    const {
      goalType,
      dailyKcal,
      proteinG,
      fatG,
      carbsG,
      confirmMacroMismatch,
    } = request
    assertGoalTypeAllowed(goalType, ageYears)

    if (
      proteinG !== undefined &&
      fatG !== undefined &&
      carbsG !== undefined &&
      !confirmMacroMismatch
    ) {
      assertMacrosMatchEnergy(dailyKcal, { proteinG, fatG, carbsG })
    }

    const estimate =
      request.mode === 'ESTIMATED'
        ? await this.computeEstimate(personId, ageYears, request)
        : null
    const now = new Date()
    const fields = {
      mode: request.mode,
      goalType,
      dailyKcal,
      proteinG: proteinG ?? null,
      fatG: fatG ?? null,
      carbsG: carbsG ?? null,
      estimatedMaintenanceKcal: estimate?.maintenanceKcal ?? null,
      calculationMethod: estimate?.method ?? null,
      estimatedAt: estimate ? now : null,
      confirmedAt: now,
      reviewRequiredAt: null,
    }
    const goal = await this.prisma.nutritionGoal.upsert({
      where: { personProfileId: personId },
      create: { personProfileId: personId, ...fields },
      update: { ...fields, revision: { increment: 1 } },
      select: goalSelect,
    })
    return { ...goal, ...checkMacros(goal) }
  }

  private async getAge(accountId: string, personId: string) {
    const dateOfBirth = await this.people.getDateOfBirth(accountId, personId)
    return calculateAge(dateOfBirth, new Date())
  }

  private async computeEstimate(
    personId: string,
    ageYears: number,
    provided: EstimateGoalRequest | SaveGoalRequest,
  ) {
    const stored = await this.prisma.personBodyParameters.findUnique({
      where: { personProfileId: personId },
      select: {
        heightCm: true,
        weightKg: true,
        activityLevel: true,
        formulaSex: true,
      },
    })
    const { heightCm, weightKg, activityLevel, formulaSex } = {
      ...stored,
      ...provided,
    }
    if (
      heightCm === undefined ||
      weightKg === undefined ||
      activityLevel === undefined ||
      formulaSex === undefined
    ) {
      throw new ApiException(
        422,
        'BODY_PARAMETERS_REQUIRED',
        'Provide height, weight, activity level and formula sex, or store them first',
      )
    }
    const estimate = estimateMaintenanceEnergy({
      ageYears,
      heightCm,
      weightKg,
      activityLevel,
      formulaSex,
    })
    if (!estimate) {
      throw new ApiException(
        422,
        'GOAL_ESTIMATION_UNAVAILABLE',
        'No estimation method applies to this age',
      )
    }
    return estimate
  }
}

function assertGoalTypeAllowed(goalType: GoalType, ageYears: number) {
  if (isGoalTypeAllowedForAge(goalType, ageYears)) return
  throw new ApiException(
    422,
    'GOAL_TYPE_NOT_SUPPORTED_FOR_AGE',
    'This goal type is not supported for this age',
  )
}

function assertMacrosMatchEnergy(dailyKcal: number, macros: Macros) {
  const { calculatedKcal, isMismatch } = compareMacroEnergy(dailyKcal, macros)
  if (!isMismatch) return
  throw new ApiException(
    422,
    'GOAL_MACROS_MISMATCH',
    'The macros do not match the daily calories; confirm to save anyway',
    { calculatedKcal, dailyKcal },
  )
}
