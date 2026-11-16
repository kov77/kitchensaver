import { describe, expect, test } from 'vitest'

import {
  type ActivityLevel,
  estimateMaintenanceEnergy,
  type FormulaSex,
  canEstimateEnergy,
  methodForAge,
} from './energy.js'

describe('adult equations (30 y, 170 cm, 70 kg)', () => {
  test.each<[FormulaSex, ActivityLevel, number]>([
    ['MALE', 'INACTIVE', 2520],
    ['MALE', 'LOW_ACTIVE', 2713],
    ['MALE', 'ACTIVE', 2902],
    ['MALE', 'VERY_ACTIVE', 3149],
    ['FEMALE', 'INACTIVE', 2167],
    ['FEMALE', 'LOW_ACTIVE', 2337],
    ['FEMALE', 'ACTIVE', 2476],
    ['FEMALE', 'VERY_ACTIVE', 2723],
  ])('%s %s -> %i kcal', (formulaSex, activityLevel, expected) => {
    expect(
      estimateMaintenanceEnergy({
        ageYears: 30,
        heightCm: 170,
        weightKg: 70,
        activityLevel,
        formulaSex,
      }),
    ).toEqual({ maintenanceKcal: expected, method: 'DRI_2023_ADULT' })
  })
})

describe('ages 3-18 equations (15 y, 165 cm, 56 kg)', () => {
  test.each<[FormulaSex, ActivityLevel, number]>([
    ['MALE', 'INACTIVE', 2511],
    ['MALE', 'LOW_ACTIVE', 2652],
    ['MALE', 'ACTIVE', 2922],
    ['MALE', 'VERY_ACTIVE', 3243],
    ['FEMALE', 'INACTIVE', 2089],
    ['FEMALE', 'LOW_ACTIVE', 2321],
    ['FEMALE', 'ACTIVE', 2461],
    ['FEMALE', 'VERY_ACTIVE', 2781],
  ])('%s %s -> %i kcal', (formulaSex, activityLevel, expected) => {
    expect(
      estimateMaintenanceEnergy({
        ageYears: 15,
        heightCm: 165,
        weightKg: 56,
        activityLevel,
        formulaSex,
      }),
    ).toEqual({ maintenanceKcal: expected, method: 'DRI_2023_AGES_3_18' })
  })
})

describe('worked examples', () => {
  test('woman, 22 y, 165 cm, 63 kg, low active', () => {
    const estimate = estimateMaintenanceEnergy({
      ageYears: 22,
      heightCm: 165,
      weightKg: 63,
      activityLevel: 'LOW_ACTIVE',
      formulaSex: 'FEMALE',
    })

    expect(estimate?.maintenanceKcal).toBe(2275)
  })

  test('man, 40 y, 175 cm, 80 kg, active', () => {
    const estimate = estimateMaintenanceEnergy({
      ageYears: 40,
      heightCm: 175,
      weightKg: 80,
      activityLevel: 'ACTIVE',
      formulaSex: 'MALE',
    })

    expect(estimate?.maintenanceKcal).toBe(2985)
  })
})

describe('method boundary and growth cost', () => {
  const profile = {
    heightCm: 170,
    weightKg: 60,
    activityLevel: 'ACTIVE',
  } as const

  test.each<[number, FormulaSex, number, string]>([
    [13, 'FEMALE', 2647, 'DRI_2023_AGES_3_18'],
    [14, 'FEMALE', 2615, 'DRI_2023_AGES_3_18'],
    [18, 'FEMALE', 2526, 'DRI_2023_AGES_3_18'],
    [19, 'FEMALE', 2429, 'DRI_2023_ADULT'],
    [13, 'MALE', 3064, 'DRI_2023_AGES_3_18'],
    [14, 'MALE', 3063, 'DRI_2023_AGES_3_18'],
    [18, 'MALE', 3078, 'DRI_2023_AGES_3_18'],
    [19, 'MALE', 2862, 'DRI_2023_ADULT'],
  ])('age %i %s -> %i kcal (%s)', (ageYears, formulaSex, kcal, method) => {
    expect(
      estimateMaintenanceEnergy({ ageYears, formulaSex, ...profile }),
    ).toEqual({ maintenanceKcal: kcal, method })
  })

  test('uses the ages 3-18 method until 18.99 and the adult method from 19', () => {
    expect(methodForAge(18.99)).toBe('DRI_2023_AGES_3_18')
    expect(methodForAge(19)).toBe('DRI_2023_ADULT')
  })

  test('has no method below 3 years', () => {
    expect(methodForAge(2.99)).toBeNull()
    expect(
      estimateMaintenanceEnergy({
        ageYears: 2,
        heightCm: 90,
        weightKg: 13,
        activityLevel: 'ACTIVE',
        formulaSex: 'MALE',
      }),
    ).toBeNull()
  })

  test('offers no new estimate above 70 years but keeps the adult method', () => {
    expect(canEstimateEnergy(70)).toBe(true)
    expect(canEstimateEnergy(71)).toBe(false)
    expect(canEstimateEnergy(2)).toBe(false)
    expect(methodForAge(71)).toBe('DRI_2023_ADULT')
    expect(
      estimateMaintenanceEnergy({
        ageYears: 71,
        heightCm: 165,
        weightKg: 65,
        activityLevel: 'ACTIVE',
        formulaSex: 'FEMALE',
      }),
    ).toBeNull()
  })
})
