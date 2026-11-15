export type GoalType = 'LOSE' | 'MAINTAIN' | 'GAIN' | 'CUSTOM'

export interface Macros {
  proteinG: number
  fatG: number
  carbsG: number
}

const MIN_AGE_FOR_LOSE_GOAL = 18
const MIN_AGE_FOR_MACRO_SUGGESTION = 18

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
