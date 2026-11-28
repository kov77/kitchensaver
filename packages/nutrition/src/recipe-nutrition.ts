import { NutritionInputError } from './errors.js'
import { calculateIngredientNutrition, finishedGrams } from './food.js'
import { macroEnergyKcal } from './goals.js'
import type { IngredientPortion, NutritionTotals } from './types.js'

export interface RecipeNutrition {
  totals: NutritionTotals
  ingredients: NutritionTotals[]
  finishedMassG: number
  per100gFinished: NutritionTotals | null
  energyCheck: {
    statedKcal: number
    macroKcal: number
    differenceRatio: number | null
  }
}

const EMPTY_TOTALS: NutritionTotals = {
  kcal: 0,
  proteinG: 0,
  fatG: 0,
  carbsG: 0,
}

function addTotals(first: NutritionTotals, second: NutritionTotals) {
  return {
    kcal: first.kcal + second.kcal,
    proteinG: first.proteinG + second.proteinG,
    fatG: first.fatG + second.fatG,
    carbsG: first.carbsG + second.carbsG,
  }
}

function scaleTotals(totals: NutritionTotals, factor: number) {
  return {
    kcal: totals.kcal * factor,
    proteinG: totals.proteinG * factor,
    fatG: totals.fatG * factor,
    carbsG: totals.carbsG * factor,
  }
}

function energyDifferenceRatio(statedKcal: number, macroKcal: number) {
  const larger = Math.max(statedKcal, macroKcal)
  return larger > 0 ? Math.abs(macroKcal - statedKcal) / larger : null
}

export function calculateRecipeNutrition(
  portions: readonly IngredientPortion[],
): RecipeNutrition {
  if (portions.length === 0) throw new NutritionInputError('RECIPE_EMPTY')

  const ingredients = portions.map(calculateIngredientNutrition)
  const totals = ingredients.reduce(addTotals, EMPTY_TOTALS)
  const finishedMassG = portions.reduce(
    (sum, portion) => sum + finishedGrams(portion),
    0,
  )
  const macroKcal = macroEnergyKcal(totals)
  return {
    totals,
    ingredients,
    finishedMassG,
    per100gFinished:
      finishedMassG > 0 ? scaleTotals(totals, 100 / finishedMassG) : null,
    energyCheck: {
      statedKcal: totals.kcal,
      macroKcal,
      differenceRatio: energyDifferenceRatio(totals.kcal, macroKcal),
    },
  }
}
