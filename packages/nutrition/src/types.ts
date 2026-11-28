import type {
  AMOUNT_UNITS,
  FOOD_STATES,
  NUTRITION_INPUT_ERROR_CODES,
} from './constants.js'

export type FoodState = (typeof FOOD_STATES)[number]

export type AmountUnit = (typeof AMOUNT_UNITS)[number]

export type NutritionInputErrorCode =
  (typeof NUTRITION_INPUT_ERROR_CODES)[number]

export interface NutritionTotals {
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

export interface FoodItem {
  id: string
  state: FoodState
  per100g: NutritionTotals
  source: { name: string; version: string }
}

export interface IngredientPortion {
  food: FoodItem
  grams: number
  gramsState: FoodState
  yieldFactor?: number
}
