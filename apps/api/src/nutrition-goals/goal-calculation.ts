import {
  compareMacroEnergy,
  estimateMaintenanceEnergy,
  isGoalTypeAllowedForAge,
  type GoalType,
  type Macros,
  suggestMacros,
} from '@kitchensaver/nutrition'

import { ApiException } from '../common/api-exception.js'
import type {
  BodyParametersRequest,
  EstimateGoalRequest,
  GoalEstimateDto,
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

// Any body parameter missing in the request is taken from the stored ones.
function computeEstimate(
  ageYears: number,
  provided: Partial<BodyParametersRequest>,
  stored: BodyParametersRequest | null,
) {
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
      method === 'DRI_2023_ADULT'
        ? 'ADULT_EQUATIONS_APPLIED_AT_ALL_AGES'
        : 'INCLUDES_GROWTH_ALLOWANCE',
    ],
    isEstimate: true,
  }
}

// Validates a goal and returns the columns to store; the server never trusts a client estimate.
export function buildGoalFields(
  request: SaveGoalRequest,
  ageYears: number,
  stored: BodyParametersRequest | null,
  now: Date,
) {
  const { goalType, dailyKcal, proteinG, fatG, carbsG, confirmMacroMismatch } =
    request
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
