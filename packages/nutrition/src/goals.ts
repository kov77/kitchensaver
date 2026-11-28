import {
  DAILY_KCAL_ISSUES,
  DAILY_KCAL_LIMITS,
  GOAL_PACES,
} from './constants.js'

export type GoalType = 'LOSE' | 'MAINTAIN' | 'GAIN' | 'CUSTOM'

export interface Macros {
  proteinG: number
  fatG: number
  carbsG: number
}

export type GoalPace = (typeof GOAL_PACES)[number]

export interface DailyKcalSuggestion {
  suggestedKcal: number
  adjustmentKcal: number
  isLimited: boolean
}

export type DailyKcalIssue = (typeof DAILY_KCAL_ISSUES)[number]

export interface DailyKcalAssessment {
  level: 'OK' | 'WARNING' | 'BLOCKED'
  issues: DailyKcalIssue[]
}

const MIN_AGE_FOR_LOSE_GOAL = 18
const MIN_AGE_FOR_MACRO_SUGGESTION = 18
const MIN_AGE_FOR_KCAL_ADJUSTMENT = 18

const KCAL_ADJUSTMENT_BY_PACE: Record<GoalPace, number> = {
  MILD: 300,
  MODERATE: 500,
}

const MACRO_MISMATCH_TOLERANCE = 0.1

const KCAL_PER_GRAM = { protein: 4, fat: 9, carbohydrate: 4 }

const SUGGESTED_ENERGY_SHARE = { protein: 0.2, fat: 0.3, carbohydrate: 0.5 }

export function isGoalTypeAllowedForAge(goalType: GoalType, ageYears: number) {
  return goalType !== 'LOSE' || ageYears >= MIN_AGE_FOR_LOSE_GOAL
}

export function macroEnergyKcal({ proteinG, fatG, carbsG }: Macros) {
  return (
    proteinG * KCAL_PER_GRAM.protein +
    fatG * KCAL_PER_GRAM.fat +
    carbsG * KCAL_PER_GRAM.carbohydrate
  )
}

export function compareMacroEnergy(dailyKcal: number, macros: Macros) {
  const calculatedKcal = macroEnergyKcal(macros)
  const differenceRatio = Math.abs(calculatedKcal - dailyKcal) / dailyKcal
  return {
    calculatedKcal,
    differenceRatio,
    isMismatch: differenceRatio > MACRO_MISMATCH_TOLERANCE,
  }
}

export function suggestMacros(kcal: number, ageYears: number): Macros | null {
  if (ageYears < MIN_AGE_FOR_MACRO_SUGGESTION) return null
  return {
    proteinG: Math.round(
      (kcal * SUGGESTED_ENERGY_SHARE.protein) / KCAL_PER_GRAM.protein,
    ),
    fatG: Math.round((kcal * SUGGESTED_ENERGY_SHARE.fat) / KCAL_PER_GRAM.fat),
    carbsG: Math.round(
      (kcal * SUGGESTED_ENERGY_SHARE.carbohydrate) / KCAL_PER_GRAM.carbohydrate,
    ),
  }
}

export function suggestDailyKcal(
  maintenanceKcal: number,
  goalType: GoalType,
  pace: GoalPace,
  ageYears: number,
): DailyKcalSuggestion | null {
  if (goalType === 'CUSTOM') return null
  if (goalType === 'MAINTAIN') {
    return {
      suggestedKcal: maintenanceKcal,
      adjustmentKcal: 0,
      isLimited: false,
    }
  }
  if (ageYears < MIN_AGE_FOR_KCAL_ADJUSTMENT) return null

  const adjustmentKcal = KCAL_ADJUSTMENT_BY_PACE[pace]

  if (goalType === 'GAIN') {
    const targetKcal = maintenanceKcal + adjustmentKcal
    const suggestedKcal = Math.max(
      maintenanceKcal,
      Math.min(targetKcal, DAILY_KCAL_LIMITS.advisedMaximum),
    )
    return {
      suggestedKcal,
      adjustmentKcal: suggestedKcal - maintenanceKcal,
      isLimited: suggestedKcal < targetKcal,
    }
  }

  if (maintenanceKcal <= DAILY_KCAL_LIMITS.advisedMinimum) return null
  const targetKcal = maintenanceKcal - adjustmentKcal
  const suggestedKcal = Math.max(targetKcal, DAILY_KCAL_LIMITS.advisedMinimum)
  return {
    suggestedKcal,
    adjustmentKcal: suggestedKcal - maintenanceKcal,
    isLimited: suggestedKcal > targetKcal,
  }
}

export function assessDailyKcal(
  dailyKcal: number,
  maintenanceKcal: number | null,
): DailyKcalAssessment {
  if (dailyKcal < DAILY_KCAL_LIMITS.blockedMinimum) {
    return { level: 'BLOCKED', issues: ['BELOW_BLOCKED_MINIMUM'] }
  }

  const issues: DailyKcalIssue[] = []
  if (dailyKcal < DAILY_KCAL_LIMITS.advisedMinimum) {
    issues.push('BELOW_ADVISED_MINIMUM')
  }
  if (dailyKcal > DAILY_KCAL_LIMITS.advisedMaximum) {
    issues.push('ABOVE_ADVISED_MAXIMUM')
  }
  if (maintenanceKcal !== null) {
    if (maintenanceKcal - dailyKcal > DAILY_KCAL_LIMITS.advisedMaximumDeficit) {
      issues.push('DEFICIT_ABOVE_ADVISED_RANGE')
    }
    if (dailyKcal - maintenanceKcal > DAILY_KCAL_LIMITS.advisedMaximumSurplus) {
      issues.push('SURPLUS_ABOVE_ADVISED_RANGE')
    }
  }
  return { level: issues.length > 0 ? 'WARNING' : 'OK', issues }
}
