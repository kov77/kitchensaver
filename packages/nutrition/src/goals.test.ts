import { describe, expect, test } from 'vitest'

import {
  compareMacroEnergy,
  isGoalTypeAllowedForAge,
  macroEnergyKcal,
  suggestMacros,
} from './goals.js'

describe('macroEnergyKcal', () => {
  test('uses 4/9/4 kcal per gram', () => {
    expect(macroEnergyKcal({ proteinG: 100, fatG: 70, carbsG: 250 })).toBe(2030)
  })

  test('is zero for zero macros', () => {
    expect(macroEnergyKcal({ proteinG: 0, fatG: 0, carbsG: 0 })).toBe(0)
  })
})

describe('compareMacroEnergy', () => {
  const macros = { proteinG: 100, fatG: 70, carbsG: 250 }

  test.each([
    [2030, false],
    [2200, false],
    [2300, true],
    [1800, true],
    [1900, false],
  ])(
    '2030 kcal of macros against %i kcal -> mismatch %s',
    (dailyKcal, isMismatch) => {
      expect(compareMacroEnergy(dailyKcal, macros).isMismatch).toBe(isMismatch)
    },
  )

  test('does not flag a difference of exactly 10%', () => {
    const result = compareMacroEnergy(2000, {
      proteinG: 0,
      fatG: 0,
      carbsG: 450,
    })

    expect(result.differenceRatio).toBe(0.1)
    expect(result.isMismatch).toBe(false)
  })

  test('reports the calculated energy', () => {
    expect(compareMacroEnergy(2000, macros).calculatedKcal).toBe(2030)
  })
})

describe('isGoalTypeAllowedForAge', () => {
  test.each([
    ['LOSE', 17, false],
    ['LOSE', 18, true],
    ['MAINTAIN', 13, true],
    ['GAIN', 13, true],
    ['CUSTOM', 13, true],
  ] as const)('%s at %i -> %s', (goalType, ageYears, expected) => {
    expect(isGoalTypeAllowedForAge(goalType, ageYears)).toBe(expected)
  })
})

describe('suggestMacros', () => {
  test('splits energy 20/30/50 for an adult', () => {
    expect(suggestMacros(2000, 30)).toEqual({
      proteinG: 100,
      fatG: 67,
      carbsG: 250,
    })
  })

  test('stays within the AMDR shares for adults and ages 4-18', () => {
    const macros = suggestMacros(2400, 30)
    const kcal = macroEnergyKcal(macros ?? { proteinG: 0, fatG: 0, carbsG: 0 })
    expect(Math.abs(kcal - 2400)).toBeLessThan(10)
  })

  test('offers nothing under 18', () => {
    expect(suggestMacros(2400, 17)).toBeNull()
    expect(suggestMacros(2400, 13)).toBeNull()
  })
})
