import {
  assessDailyKcal,
  canEstimateEnergy,
  compareMacroEnergy,
  DAILY_KCAL_LIMITS,
  estimateMaintenanceEnergy,
  GOAL_PACES,
  isGoalTypeAllowedForAge,
  type GoalType,
  type Macros,
  suggestDailyKcal,
  suggestMacros,
} from '@kitchensaver/nutrition'

import { ApiException } from '../common/api-exception.js'
import type {
  BodyParametersRequest,
  EstimateGoalRequest,
  GoalEstimateDto,
  KcalWarningDto,
  SaveGoalRequest,
} from './nutrition-goals.dto.js'

const METHODOLOGY =
  'Dietary Reference Intakes for Energy, National Academies, 2023 (doi:10.17226/26818)'

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

export function maintenanceKcalFor(
  ageYears: number,
  bodyParameters: BodyParametersRequest | null,
) {
  if (!bodyParameters || !canEstimateEnergy(ageYears)) return null
  const estimate = estimateMaintenanceEnergy({ ageYears, ...bodyParameters })
  return estimate?.maintenanceKcal ?? null
}

export function checkDailyKcal(
  dailyKcal: number,
  maintenanceKcal: number | null,
): KcalWarningDto | null {
  const { issues } = assessDailyKcal(dailyKcal, maintenanceKcal)
  if (issues.length === 0) return null
  return {
    issues,
    dailyKcal,
    maintenanceKcal,
    limits: DAILY_KCAL_LIMITS,
  }
}

function assertKcalAllowed(
  dailyKcal: number,
  maintenanceKcal: number | null,
  confirmKcalWarning: boolean | undefined,
) {
  const { level, issues } = assessDailyKcal(dailyKcal, maintenanceKcal)
  if (level === 'BLOCKED') {
    throw new ApiException(
      422,
      'GOAL_KCAL_BELOW_MINIMUM',
      'The daily calories are below the lowest value the app accepts',
      { dailyKcal, limits: DAILY_KCAL_LIMITS },
    )
  }
  if (level === 'OK' || confirmKcalWarning) return
  throw new ApiException(
    422,
    'GOAL_KCAL_OUT_OF_RANGE',
    'The daily calories are outside the recommended range; confirm to save anyway',
    { issues, dailyKcal, maintenanceKcal, limits: DAILY_KCAL_LIMITS },
  )
}

function estimationUnavailable() {
  return new ApiException(
    422,
    'GOAL_ESTIMATION_UNAVAILABLE',
    'No estimation method applies to this age',
  )
}

function computeEstimate(
  ageYears: number,
  provided: Partial<BodyParametersRequest>,
  stored: BodyParametersRequest | null,
) {
  if (!canEstimateEnergy(ageYears)) throw estimationUnavailable()
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
  if (!estimate) throw estimationUnavailable()
  return estimate
}

export function previewEstimate(
  ageYears: number,
  request: EstimateGoalRequest,
  stored: BodyParametersRequest | null,
): GoalEstimateDto {
  assertGoalTypeAllowed(request.goalType, ageYears)
  const { maintenanceKcal, method } = computeEstimate(ageYears, request, stored)
  return {
    estimatedMaintenanceKcal: maintenanceKcal,
    proposedMacros: suggestMacros(maintenanceKcal, ageYears),
    calculationMethod: method,
    methodology: METHODOLOGY,
    assumptions: [
      'AGE_IN_COMPLETED_YEARS',
      'MAINTENANCE_ENERGY_NOT_A_TARGET',
      'LARGE_INDIVIDUAL_VARIATION',
      ...(method === 'DRI_2023_ADULT' ? [] : ['INCLUDES_GROWTH_ALLOWANCE']),
    ],
    kcalSuggestions: GOAL_PACES.flatMap((pace) => {
      const suggestion = suggestDailyKcal(
        maintenanceKcal,
        request.goalType,
        pace,
        ageYears,
      )
      return suggestion ? [{ pace, ...suggestion }] : []
    }),
    isEstimate: true,
  }
}

export function buildGoalFields(
  request: SaveGoalRequest,
  ageYears: number,
  stored: BodyParametersRequest | null,
  now: Date,
) {
  const {
    goalType,
    dailyKcal,
    proteinG,
    fatG,
    carbsG,
    confirmMacroMismatch,
    confirmKcalWarning,
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
      ? computeEstimate(ageYears, request, stored)
      : null
  assertKcalAllowed(
    dailyKcal,
    estimate?.maintenanceKcal ?? maintenanceKcalFor(ageYears, stored),
    confirmKcalWarning,
  )
  return {
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
}
