import * as fastCheck from 'fast-check'

import { FOOD_LIMITS, FOOD_STATES } from '../constants.js'
import { NutritionInputError } from '../errors.js'
import type { FoodItem, FoodState } from '../types.js'

export const TEST_SOURCE = { name: 'test-fixture', version: '1' }

export function otherState(state: FoodState): FoodState {
  return state === 'RAW' ? 'COOKED' : 'RAW'
}

export function codeOf(action: () => unknown) {
  try {
    action()
  } catch (error) {
    if (error instanceof NutritionInputError) return error.code
    throw error
  }
  return null
}

export const validFoodArbitrary = fastCheck
  .record({
    state: fastCheck.constantFrom(...FOOD_STATES),
    kcal: fastCheck.double({ min: 0, max: 900, noNaN: true }),
    proteinG: fastCheck.double({ min: 0, max: 33, noNaN: true }),
    fatG: fastCheck.double({ min: 0, max: 33, noNaN: true }),
    carbsG: fastCheck.double({ min: 0, max: 33, noNaN: true }),
  })
  .map(({ state, ...per100g }): FoodItem => ({
    id: 'generated',
    state,
    per100g,
    source: TEST_SOURCE,
  }))

export const validGramsArbitrary = fastCheck.double({
  min: 0,
  max: FOOD_LIMITS.maxIngredientGrams,
  noNaN: true,
})
