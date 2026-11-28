import * as fastCheck from 'fast-check'
import { describe, expect, test } from 'vitest'

import { FOOD_LIMITS, FOOD_STATES } from './constants.js'
import {
  calculateIngredientNutrition,
  convertToGrams,
  finishedGrams,
} from './food.js'
import {
  codeOf,
  otherState,
  TEST_SOURCE,
  validFoodArbitrary,
  validGramsArbitrary,
} from './test-support/arbitraries.js'
import type { FoodItem, NutritionInputErrorCode } from './types.js'

const rice: FoodItem = {
  id: 'rice-raw',
  state: 'RAW',
  per100g: { kcal: 360, proteinG: 7, fatG: 0.6, carbsG: 80 },
  source: TEST_SOURCE,
}

function ingredient(grams: number, food: FoodItem = rice) {
  return () =>
    calculateIngredientNutrition({ food, grams, gramsState: food.state })
}

describe('calculateIngredientNutrition', () => {
  test('scales the per-100 g values by the grams', () => {
    expect(ingredient(50)()).toEqual({
      kcal: 180,
      proteinG: 3.5,
      fatG: 0.3,
      carbsG: 40,
    })
  })

  test('is zero for zero grams', () => {
    expect(ingredient(0)()).toEqual({
      kcal: 0,
      proteinG: 0,
      fatG: 0,
      carbsG: 0,
    })
  })

  test('accepts the largest allowed amount', () => {
    expect(ingredient(FOOD_LIMITS.maxIngredientGrams)().kcal).toBe(18000)
  })

  test.each<[string, number, NutritionInputErrorCode]>([
    ['negative grams', -1, 'GRAMS_OUT_OF_RANGE'],
    ['above the largest amount', 5000.01, 'GRAMS_OUT_OF_RANGE'],
    ['NaN', Number.NaN, 'GRAMS_NOT_FINITE'],
    ['Infinity', Number.POSITIVE_INFINITY, 'GRAMS_NOT_FINITE'],
    ['negative Infinity', Number.NEGATIVE_INFINITY, 'GRAMS_NOT_FINITE'],
  ])('rejects %s', (_name, grams, code) => {
    expect(codeOf(ingredient(grams))).toBe(code)
  })

  test.each(FOOD_STATES)('calculates a food recorded as %s', (state) => {
    expect(ingredient(50, { ...rice, state })().kcal).toBe(180)
  })

  test.each(
    FOOD_STATES.flatMap((foodState) =>
      FOOD_STATES.filter((gramsState) => gramsState !== foodState).map(
        (gramsState) => [foodState, gramsState] as const,
      ),
    ),
  )('rejects %s food with %s grams', (foodState, gramsState) => {
    expect(
      codeOf(() =>
        calculateIngredientNutrition({
          food: { ...rice, state: foodState },
          grams: 100,
          gramsState,
        }),
      ),
    ).toBe('FOOD_STATE_MISMATCH')
  })

  test('rejects grams of the other state than the food record', () => {
    expect(
      codeOf(() =>
        calculateIngredientNutrition({
          food: rice,
          grams: 100,
          gramsState: 'COOKED',
        }),
      ),
    ).toBe('FOOD_STATE_MISMATCH')
  })

  test.each<[string, FoodItem['per100g']]>([
    ['negative energy', { kcal: -1, proteinG: 0, fatG: 0, carbsG: 0 }],
    ['negative protein', { kcal: 0, proteinG: -1, fatG: 0, carbsG: 0 }],
    ['NaN fat', { kcal: 0, proteinG: 0, fatG: Number.NaN, carbsG: 0 }],
    ['energy above 900', { kcal: 901, proteinG: 0, fatG: 0, carbsG: 0 }],
    ['macros above 100 g', { kcal: 100, proteinG: 50, fatG: 30, carbsG: 21.5 }],
  ])('rejects a food with %s', (_name, per100g) => {
    expect(codeOf(ingredient(100, { ...rice, per100g }))).toBe(
      'FOOD_VALUES_INVALID',
    )
  })

  test('tolerates macros that add up to 101 g because of rounding', () => {
    const food = {
      ...rice,
      per100g: { kcal: 100, proteinG: 50, fatG: 30, carbsG: 21 },
    }

    expect(ingredient(100, food)().carbsG).toBe(21)
  })

  test.each<[string, FoodItem]>([
    ['an empty id', { ...rice, id: '' }],
    ['an empty source name', { ...rice, source: { name: '', version: '1' } }],
    [
      'an empty source version',
      { ...rice, source: { name: 'x', version: '' } },
    ],
  ])('rejects a food with %s', (_name, food) => {
    expect(codeOf(ingredient(100, food))).toBe('FOOD_VALUES_INVALID')
  })
})

describe('convertToGrams', () => {
  test('keeps grams as they are', () => {
    expect(convertToGrams({ amount: 120, unit: 'G' })).toBe(120)
  })

  test('converts millilitres with a known density', () => {
    expect(
      convertToGrams({ amount: 100, unit: 'ML', densityGPerMl: 1.03 }),
    ).toBe(103)
  })

  test.each<[string, number | undefined, NutritionInputErrorCode]>([
    ['no density', undefined, 'DENSITY_REQUIRED'],
    ['zero density', 0, 'DENSITY_INVALID'],
    ['negative density', -1, 'DENSITY_INVALID'],
    ['NaN density', Number.NaN, 'DENSITY_INVALID'],
  ])('refuses millilitres with %s', (_name, densityGPerMl, code) => {
    expect(
      codeOf(() => convertToGrams({ amount: 10, unit: 'ML', densityGPerMl })),
    ).toBe(code)
  })

  test.each<[string, number, NutritionInputErrorCode]>([
    ['a negative amount', -1, 'GRAMS_OUT_OF_RANGE'],
    ['NaN', Number.NaN, 'GRAMS_NOT_FINITE'],
    ['Infinity', Number.POSITIVE_INFINITY, 'GRAMS_NOT_FINITE'],
  ])('refuses %s', (_name, amount, code) => {
    expect(codeOf(() => convertToGrams({ amount, unit: 'G' }))).toBe(code)
  })
})

describe('finishedGrams', () => {
  test('multiplies raw grams by the yield factor', () => {
    expect(
      finishedGrams({ grams: 100, gramsState: 'RAW', yieldFactor: 2.8 }),
    ).toBeCloseTo(280, 9)
  })

  test('keeps the grams without a yield factor', () => {
    expect(finishedGrams({ grams: 100, gramsState: 'COOKED' })).toBe(100)
  })

  test.each([0.04, 10.1, Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'rejects the yield factor %s',
    (yieldFactor) => {
      expect(
        codeOf(() =>
          finishedGrams({ grams: 100, gramsState: 'RAW', yieldFactor }),
        ),
      ).toBe('YIELD_FACTOR_INVALID')
    },
  )

  test.each(FOOD_STATES.filter((state) => state !== 'RAW'))(
    'rejects a yield factor on grams in the state %s',
    (gramsState) => {
      expect(
        codeOf(() =>
          finishedGrams({ grams: 100, gramsState, yieldFactor: 2.8 }),
        ),
      ).toBe('YIELD_ON_NON_RAW_GRAMS')
    },
  )

  test.each(FOOD_STATES)(
    'keeps grams in the state %s without a yield',
    (gramsState) => {
      expect(finishedGrams({ grams: 100, gramsState })).toBe(100)
    },
  )
})

describe('properties of calculateIngredientNutrition', () => {
  test('never gives a negative or non-finite value for valid input', () => {
    fastCheck.assert(
      fastCheck.property(
        validFoodArbitrary,
        validGramsArbitrary,
        (food, grams) =>
          Object.values(ingredient(grams, food)()).every(
            (value) => Number.isFinite(value) && value >= 0,
          ),
      ),
    )
  })

  test('doubles when the grams double', () => {
    fastCheck.assert(
      fastCheck.property(
        validFoodArbitrary,
        fastCheck.double({ min: 0, max: 2500, noNaN: true }),
        (food, grams) => {
          const single = ingredient(grams, food)()
          const double = ingredient(grams * 2, food)()
          return (
            Math.abs(double.kcal - single.kcal * 2) <= 1e-9 * (1 + double.kcal)
          )
        },
      ),
    )
  })

  test('always refuses grams outside the allowed range', () => {
    const outside = fastCheck.oneof(
      fastCheck.double({ min: -1e6, max: -1e-9, noNaN: true }),
      fastCheck.double({
        min: FOOD_LIMITS.maxIngredientGrams + 0.001,
        max: 1e9,
        noNaN: true,
      }),
      fastCheck.constantFrom(
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
      ),
    )

    fastCheck.assert(
      fastCheck.property(
        validFoodArbitrary,
        outside,
        (food, grams) => codeOf(ingredient(grams, food)) !== null,
      ),
    )
  })

  test('accepts grams declared in the state of the food record', () => {
    fastCheck.assert(
      fastCheck.property(
        validFoodArbitrary,
        validGramsArbitrary,
        (food, grams) =>
          codeOf(() =>
            calculateIngredientNutrition({
              food,
              grams,
              gramsState: food.state,
            }),
          ) === null,
      ),
    )
  })

  test('always refuses grams declared in the other state', () => {
    fastCheck.assert(
      fastCheck.property(
        validFoodArbitrary,
        validGramsArbitrary,
        (food, grams) =>
          codeOf(() =>
            calculateIngredientNutrition({
              food,
              grams,
              gramsState: otherState(food.state),
            }),
          ) === 'FOOD_STATE_MISMATCH',
      ),
    )
  })
})
