import { describe, expect, test } from 'vitest'

import {
  assessDailyKcal,
  compareMacroEnergy,
  isGoalTypeAllowedForAge,
  macroEnergyKcal,
  suggestDailyKcal,
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

describe('suggestDailyKcal', () => {
  test.each([
    ['LOSE', 'MILD', 2000, 1700, -300],
    ['LOSE', 'MODERATE', 2000, 1500, -500],
    ['GAIN', 'MILD', 2000, 2300, 300],
    ['GAIN', 'MODERATE', 2000, 2500, 500],
    ['MAINTAIN', 'MILD', 2000, 2000, 0],
    ['MAINTAIN', 'MODERATE', 2000, 2000, 0],
  ] as const)(
    '%s at %s pace from 2000 kcal -> %i (%i)',
    (goalType, pace, maintenanceKcal, suggestedKcal, adjustmentKcal) => {
      expect(suggestDailyKcal(maintenanceKcal, goalType, pace, 30)).toEqual({
        suggestedKcal,
        adjustmentKcal,
        isLimitedByMinimum: false,
      })
    },
  )

  test('a deficit that ends exactly at the minimum is not limited', () => {
    expect(suggestDailyKcal(1700, 'LOSE', 'MODERATE', 30)).toEqual({
      suggestedKcal: 1200,
      adjustmentKcal: -500,
      isLimitedByMinimum: false,
    })
  })

  test('a deficit is stopped at 1200 kcal', () => {
    expect(suggestDailyKcal(1600, 'LOSE', 'MODERATE', 30)).toEqual({
      suggestedKcal: 1200,
      adjustmentKcal: -400,
      isLimitedByMinimum: true,
    })
  })

  test.each([1200, 1100, 900])(
    'maintenance of %i kcal gets no deficit',
    (maintenanceKcal) => {
      expect(suggestDailyKcal(maintenanceKcal, 'LOSE', 'MILD', 30)).toEqual({
        suggestedKcal: maintenanceKcal,
        adjustmentKcal: 0,
        isLimitedByMinimum: true,
      })
    },
  )

  test('a surplus has no minimum or maximum limit', () => {
    expect(suggestDailyKcal(3400, 'GAIN', 'MODERATE', 30)?.suggestedKcal).toBe(
      3900,
    )
  })

  test('CUSTOM has no suggestion', () => {
    expect(suggestDailyKcal(2000, 'CUSTOM', 'MILD', 30)).toBeNull()
  })

  test.each(['LOSE', 'GAIN'] as const)(
    '%s has no suggestion under 18',
    (goalType) => {
      expect(suggestDailyKcal(2000, goalType, 'MILD', 17)).toBeNull()
    },
  )

  test('MAINTAIN is still suggested under 18', () => {
    expect(suggestDailyKcal(2000, 'MAINTAIN', 'MILD', 17)?.suggestedKcal).toBe(
      2000,
    )
  })

  test('age 18 gets a suggestion', () => {
    expect(suggestDailyKcal(2000, 'LOSE', 'MILD', 18)?.suggestedKcal).toBe(1700)
  })
})

describe('assessDailyKcal', () => {
  test.each([
    [799, 'BLOCKED', ['BELOW_BLOCKED_MINIMUM']],
    [800, 'WARNING', ['BELOW_ADVISED_MINIMUM']],
    [1199, 'WARNING', ['BELOW_ADVISED_MINIMUM']],
    [1200, 'OK', []],
    [3200, 'OK', []],
    [3201, 'WARNING', ['ABOVE_ADVISED_MAXIMUM']],
  ] as const)(
    '%i kcal without maintenance -> %s',
    (dailyKcal, level, issues) => {
      expect(assessDailyKcal(dailyKcal, null)).toEqual({ level, issues })
    },
  )

  test.each([
    [1500, 'OK', []],
    [1499, 'WARNING', ['DEFICIT_ABOVE_ADVISED_RANGE']],
    [3000, 'OK', []],
    [3001, 'WARNING', ['SURPLUS_ABOVE_ADVISED_RANGE']],
  ] as const)(
    '%i kcal against 2500 maintenance -> %s',
    (dailyKcal, level, issues) => {
      expect(assessDailyKcal(dailyKcal, 2500)).toEqual({ level, issues })
    },
  )

  test('collects every issue that applies', () => {
    expect(assessDailyKcal(1000, 2500)).toEqual({
      level: 'WARNING',
      issues: ['BELOW_ADVISED_MINIMUM', 'DEFICIT_ABOVE_ADVISED_RANGE'],
    })
  })

  test('a blocked value is blocked whatever the maintenance is', () => {
    expect(assessDailyKcal(500, 2500)).toEqual({
      level: 'BLOCKED',
      issues: ['BELOW_BLOCKED_MINIMUM'],
    })
  })
})
