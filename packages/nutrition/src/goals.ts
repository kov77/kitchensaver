export type GoalType = 'LOSE' | 'MAINTAIN' | 'GAIN' | 'CUSTOM'

export interface Macros {
  proteinG: number
  fatG: number
  carbsG: number
}

export type GoalPace = 'MILD' | 'MODERATE'

export interface DailyKcalSuggestion {
  suggestedKcal: number
  adjustmentKcal: number
  isLimitedByMinimum: boolean
}

export type DailyKcalIssue =
  | 'BELOW_BLOCKED_MINIMUM'
  | 'BELOW_ADVISED_MINIMUM'
  | 'ABOVE_ADVISED_MAXIMUM'
  | 'DEFICIT_ABOVE_ADVISED_RANGE'
  | 'SURPLUS_ABOVE_ADVISED_RANGE'

export interface DailyKcalAssessment {
  level: 'OK' | 'WARNING' | 'BLOCKED'
  issues: DailyKcalIssue[]
}

const MIN_AGE_FOR_LOSE_GOAL = 18
const MIN_AGE_FOR_MACRO_SUGGESTION = 18
const MIN_AGE_FOR_KCAL_ADJUSTMENT = 18

const DEFICIT_KCAL_BY_PACE: Record<GoalPace, number> = {
  MILD: 300,
  MODERATE: 500,
}
const SURPLUS_KCAL_BY_PACE: Record<GoalPace, number> = {
  MILD: 300,
  MODERATE: 500,
}

const BLOCKED_MINIMUM_DAILY_KCAL = 800
const ADVISED_MINIMUM_DAILY_KCAL = 1200
const ADVISED_MAXIMUM_DAILY_KCAL = 3200
const ADVISED_MAXIMUM_DEFICIT_KCAL = 1000
const ADVISED_MAXIMUM_SURPLUS_KCAL = 500

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
      isLimitedByMinimum: false,
    }
  }
  if (ageYears < MIN_AGE_FOR_KCAL_ADJUSTMENT) return null

  if (goalType === 'GAIN') {
    const adjustmentKcal = SURPLUS_KCAL_BY_PACE[pace]
    return {
      suggestedKcal: maintenanceKcal + adjustmentKcal,
      adjustmentKcal,
      isLimitedByMinimum: false,
    }
  }

  const targetKcal = maintenanceKcal - DEFICIT_KCAL_BY_PACE[pace]
  const suggestedKcal = Math.min(
    maintenanceKcal,
    Math.max(targetKcal, ADVISED_MINIMUM_DAILY_KCAL),
  )
  return {
    suggestedKcal,
    adjustmentKcal: suggestedKcal - maintenanceKcal,
    isLimitedByMinimum: suggestedKcal > targetKcal,
  }
}

export function assessDailyKcal(
  dailyKcal: number,
  maintenanceKcal: number | null,
): DailyKcalAssessment {
  if (dailyKcal < BLOCKED_MINIMUM_DAILY_KCAL) {
    return { level: 'BLOCKED', issues: ['BELOW_BLOCKED_MINIMUM'] }
  }

  const issues: DailyKcalIssue[] = []
  if (dailyKcal < ADVISED_MINIMUM_DAILY_KCAL) {
    issues.push('BELOW_ADVISED_MINIMUM')
  }
  if (dailyKcal > ADVISED_MAXIMUM_DAILY_KCAL) {
    issues.push('ABOVE_ADVISED_MAXIMUM')
  }
  if (maintenanceKcal !== null) {
    if (maintenanceKcal - dailyKcal > ADVISED_MAXIMUM_DEFICIT_KCAL) {
      issues.push('DEFICIT_ABOVE_ADVISED_RANGE')
    }
    if (dailyKcal - maintenanceKcal > ADVISED_MAXIMUM_SURPLUS_KCAL) {
      issues.push('SURPLUS_ABOVE_ADVISED_RANGE')
    }
  }
  return { level: issues.length > 0 ? 'WARNING' : 'OK', issues }
}
