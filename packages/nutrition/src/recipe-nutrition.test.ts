import * as fastCheck from 'fast-check'
import { describe, expect, test } from 'vitest'

import { FOOD_LIMITS, FOOD_STATES } from './constants.js'
import { NutritionInputError } from './errors.js'
import golden from './golden/recipes.json' with { type: 'json' }
import { calculateRecipeNutrition } from './recipe-nutrition.js'
import {
  codeOf,
  TEST_SOURCE,
  validFoodArbitrary,
  validGramsArbitrary,
} from './test-support/arbitraries.js'
import type { FoodState, IngredientPortion } from './types.js'

interface GoldenPortion {
  food: string
  grams: number
  gramsState: string
  yieldFactor?: number
}

interface GoldenCase {
  name: string
  portions: GoldenPortion[]
  expected: {
    kcal: number
    proteinG: number
    fatG: number
    carbsG: number
    finishedMassG: number
  }
}

const goldenCases: GoldenCase[] = golden.cases

function toFoodState(value: string): FoodState {
  const state = FOOD_STATES.find((known) => known === value)
  if (state) return state
  throw new Error(`Unknown food state in the golden file: ${value}`)
}

function toPortion({
  food: foodKey,
  grams,
  gramsState,
  yieldFactor,
}: GoldenPortion): IngredientPortion {
  const record = Object.entries(golden.foods).find(([key]) => key === foodKey)
  if (!record) throw new Error(`Unknown food in the golden file: ${foodKey}`)
  const { id, state, per100g } = record[1]
  return {
    food: { id, state: toFoodState(state), per100g, source: TEST_SOURCE },
    grams,
    gramsState: toFoodState(gramsState),
    yieldFactor,
  }
}

function portionsOf(name: string) {
  const found = goldenCases.find((goldenCase) => goldenCase.name === name)
  expect(found).toBeDefined()
  return (found?.portions ?? []).map(toPortion)
}

const RECIPE_NAME = 'chicken, rice and broccoli with 15 g oil'
const COOKING_RICE_NAME =
  'raw rice that cooks to 2.8 times its mass keeps its energy'
const COOKED_RICE_NAME = '100 g cooked rice'

describe('calculateRecipeNutrition golden cases', () => {
  test.each(goldenCases)('$name', ({ portions, expected }) => {
    const result = calculateRecipeNutrition(portions.map(toPortion))

    expect(result.totals.kcal).toBeCloseTo(expected.kcal, 9)
    expect(result.totals.proteinG).toBeCloseTo(expected.proteinG, 9)
    expect(result.totals.fatG).toBeCloseTo(expected.fatG, 9)
    expect(result.totals.carbsG).toBeCloseTo(expected.carbsG, 9)
    expect(result.finishedMassG).toBeCloseTo(expected.finishedMassG, 9)
  })
})

describe('calculateRecipeNutrition', () => {
  test('refuses a recipe without ingredients', () => {
    expect(() => calculateRecipeNutrition([])).toThrow(NutritionInputError)
  })

  test('gives per-100 g values of the finished dish, so cooking changes density and not energy', () => {
    const result = calculateRecipeNutrition(portionsOf(COOKING_RICE_NAME))

    expect(result.totals.kcal).toBeCloseTo(360, 9)
    expect(result.per100gFinished?.kcal).toBeCloseTo(360 / 2.8, 9)
  })

  test('refuses a yield factor on grams that are already cooked', () => {
    const [cooked] = portionsOf(COOKED_RICE_NAME)
    expect(cooked).toBeDefined()

    const code = codeOf(() =>
      calculateRecipeNutrition(cooked ? [{ ...cooked, yieldFactor: 2.8 }] : []),
    )

    expect(code).toBe('YIELD_ON_NON_RAW_GRAMS')
  })

  test('accepts raw and cooked ingredients together because each quantity matches its own record', () => {
    const [cooked] = portionsOf(COOKED_RICE_NAME)
    const [raw] = portionsOf('100 g raw rice')
    expect(cooked).toBeDefined()
    expect(raw).toBeDefined()

    const result = calculateRecipeNutrition(cooked && raw ? [cooked, raw] : [])

    expect(result.totals.kcal).toBeCloseTo(490, 9)
  })

  test('has no per-100 g values when the dish has no mass', () => {
    const result = calculateRecipeNutrition(
      portionsOf('100 g raw rice').map((portion) => ({ ...portion, grams: 0 })),
    )

    expect(result.per100gFinished).toBeNull()
    expect(result.energyCheck.differenceRatio).toBeNull()
  })

  test('reports the difference between stated energy and 4/9/4 without forcing them equal', () => {
    const result = calculateRecipeNutrition(portionsOf(RECIPE_NAME))

    expect(result.totals.kcal).toBeCloseTo(634, 9)
    expect(result.energyCheck.macroKcal).toBeCloseTo(
      41.4 * 4 + 20.38 * 9 + 71 * 4,
      9,
    )
    expect(result.energyCheck.differenceRatio).toBeCloseTo(
      (634 - (41.4 * 4 + 20.38 * 9 + 71 * 4)) / 634,
      9,
    )
  })

  test('shows a difference when stated energy is zero but the macros are not', () => {
    const [rice] = portionsOf('100 g raw rice')
    expect(rice).toBeDefined()
    const food = rice && {
      ...rice.food,
      per100g: { kcal: 0, proteinG: 30, fatG: 0, carbsG: 0 },
    }

    const result = calculateRecipeNutrition(
      rice && food ? [{ ...rice, food }] : [],
    )

    expect(result.energyCheck.differenceRatio).toBe(1)
  })

  test('keeps one entry per ingredient, in order', () => {
    const result = calculateRecipeNutrition(portionsOf(RECIPE_NAME))

    expect(result.ingredients.map(({ kcal }) => kcal)).toEqual([
      288, 180, 34, 132,
    ])
  })
})

const portionArbitrary = fastCheck
  .tuple(validFoodArbitrary, validGramsArbitrary)
  .map(([food, grams]): IngredientPortion => ({
    food,
    grams,
    gramsState: food.state,
  }))

const portionsArbitrary = fastCheck.array(portionArbitrary, {
  minLength: 1,
  maxLength: 8,
})

function closeEnough(actual: number, expected: number) {
  return Math.abs(actual - expected) <= 1e-9 * (1 + Math.abs(expected))
}

function sumOf(values: readonly number[]) {
  return values.reduce((sum, value) => sum + value, 0)
}

describe('properties of calculateRecipeNutrition', () => {
  test('every total equals the sum of the same field of the ingredients', () => {
    fastCheck.assert(
      fastCheck.property(portionsArbitrary, (list) => {
        const { totals, ingredients } = calculateRecipeNutrition(list)
        return (
          closeEnough(
            totals.kcal,
            sumOf(ingredients.map(({ kcal }) => kcal)),
          ) &&
          closeEnough(
            totals.proteinG,
            sumOf(ingredients.map(({ proteinG }) => proteinG)),
          ) &&
          closeEnough(
            totals.fatG,
            sumOf(ingredients.map(({ fatG }) => fatG)),
          ) &&
          closeEnough(
            totals.carbsG,
            sumOf(ingredients.map(({ carbsG }) => carbsG)),
          )
        )
      }),
    )
  })

  test('the order of the ingredients does not change any total', () => {
    fastCheck.assert(
      fastCheck.property(portionsArbitrary, (list) => {
        const forward = calculateRecipeNutrition(list).totals
        const backward = calculateRecipeNutrition([...list].reverse()).totals
        return (
          closeEnough(forward.kcal, backward.kcal) &&
          closeEnough(forward.proteinG, backward.proteinG) &&
          closeEnough(forward.fatG, backward.fatG) &&
          closeEnough(forward.carbsG, backward.carbsG)
        )
      }),
    )
  })

  test('a yield factor on raw grams scales the mass and the per-100 g values, never the totals', () => {
    const measurablePortions = fastCheck.array(
      portionArbitrary.filter(({ grams }) => grams === 0 || grams >= 0.001),
      { minLength: 1, maxLength: 8 },
    )
    const rawPortions = measurablePortions.map((list) =>
      list.map(({ food, grams }): IngredientPortion => ({
        food: { ...food, state: 'RAW' },
        grams,
        gramsState: 'RAW',
      })),
    )
    const yieldFactor = fastCheck.double({
      min: FOOD_LIMITS.minYieldFactor,
      max: FOOD_LIMITS.maxYieldFactor,
      noNaN: true,
    })

    fastCheck.assert(
      fastCheck.property(rawPortions, yieldFactor, (list, factor) => {
        const plain = calculateRecipeNutrition(list)
        const cooked = calculateRecipeNutrition(
          list.map((portion) => ({ ...portion, yieldFactor: factor })),
        )
        const expectedPer100gKcal =
          cooked.finishedMassG > 0
            ? (cooked.totals.kcal * 100) / cooked.finishedMassG
            : null
        return (
          closeEnough(plain.totals.kcal, cooked.totals.kcal) &&
          closeEnough(cooked.finishedMassG, plain.finishedMassG * factor) &&
          (expectedPer100gKcal === null
            ? cooked.per100gFinished === null
            : closeEnough(
                cooked.per100gFinished?.kcal ?? Number.NaN,
                expectedPer100gKcal,
              ))
        )
      }),
    )
  })

  test('never gives a negative or non-finite total', () => {
    fastCheck.assert(
      fastCheck.property(portionsArbitrary, (list) =>
        Object.values(calculateRecipeNutrition(list).totals).every(
          (value) => Number.isFinite(value) && value >= 0,
        ),
      ),
    )
  })
})
