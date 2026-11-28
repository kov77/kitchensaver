import { FOOD_LIMITS } from './constants.js'
import { NutritionInputError } from './errors.js'
import type {
  AmountUnit,
  FoodItem,
  IngredientPortion,
  NutritionTotals,
} from './types.js'

function isNonNegativeFinite(value: number) {
  return Number.isFinite(value) && value >= 0
}

function assertValidGrams(grams: number) {
  if (!Number.isFinite(grams)) throw new NutritionInputError('GRAMS_NOT_FINITE')
  if (grams < 0 || grams > FOOD_LIMITS.maxIngredientGrams) {
    throw new NutritionInputError('GRAMS_OUT_OF_RANGE')
  }
}

function assertValidFood({ id, per100g, source }: FoodItem) {
  const { kcal, proteinG, fatG, carbsG } = per100g
  const values = [kcal, proteinG, fatG, carbsG]
  const macroGrams = proteinG + fatG + carbsG
  const hasProvenance = id !== '' && source.name !== '' && source.version !== ''
  const isValid =
    hasProvenance &&
    values.every(isNonNegativeFinite) &&
    kcal <= FOOD_LIMITS.maxKcalPer100g &&
    macroGrams <=
      FOOD_LIMITS.maxMacroGramsPer100g + FOOD_LIMITS.macroGramsTolerance
  if (!isValid) throw new NutritionInputError('FOOD_VALUES_INVALID')
}

function assertValidYieldFactor(yieldFactor: number) {
  const isValid =
    Number.isFinite(yieldFactor) &&
    yieldFactor >= FOOD_LIMITS.minYieldFactor &&
    yieldFactor <= FOOD_LIMITS.maxYieldFactor
  if (!isValid) throw new NutritionInputError('YIELD_FACTOR_INVALID')
}

export function calculateIngredientNutrition({
  food,
  grams,
  gramsState,
}: Omit<IngredientPortion, 'yieldFactor'>): NutritionTotals {
  assertValidGrams(grams)
  assertValidFood(food)
  if (food.state !== gramsState) {
    throw new NutritionInputError('FOOD_STATE_MISMATCH')
  }
  const { kcal, proteinG, fatG, carbsG } = food.per100g
  const share = grams / 100
  return {
    kcal: kcal * share,
    proteinG: proteinG * share,
    fatG: fatG * share,
    carbsG: carbsG * share,
  }
}

export function convertToGrams({
  amount,
  unit,
  densityGPerMl,
}: {
  amount: number
  unit: AmountUnit
  densityGPerMl?: number
}) {
  if (!Number.isFinite(amount))
    throw new NutritionInputError('GRAMS_NOT_FINITE')
  if (amount < 0) throw new NutritionInputError('GRAMS_OUT_OF_RANGE')
  if (unit === 'G') return amount
  if (densityGPerMl === undefined) {
    throw new NutritionInputError('DENSITY_REQUIRED')
  }
  if (!Number.isFinite(densityGPerMl) || densityGPerMl <= 0) {
    throw new NutritionInputError('DENSITY_INVALID')
  }
  return amount * densityGPerMl
}

export function finishedGrams({
  grams,
  gramsState,
  yieldFactor = 1,
}: Pick<IngredientPortion, 'grams' | 'gramsState' | 'yieldFactor'>) {
  assertValidGrams(grams)
  assertValidYieldFactor(yieldFactor)
  if (gramsState !== 'RAW' && yieldFactor !== 1) {
    throw new NutritionInputError('YIELD_ON_NON_RAW_GRAMS')
  }
  return grams * yieldFactor
}
