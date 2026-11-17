export type ActivityLevel = 'INACTIVE' | 'LOW_ACTIVE' | 'ACTIVE' | 'VERY_ACTIVE'

export type FormulaSex = 'MALE' | 'FEMALE'

export type CalculationMethod = 'DRI_2023_ADULT' | 'DRI_2023_AGES_3_18'

export interface EnergyInput {
  ageYears: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  formulaSex: FormulaSex
}

export interface EnergyEstimate {
  maintenanceKcal: number
  method: CalculationMethod
}

interface Equation {
  intercept: number
  age: number
  height: number
  weight: number
}

// Dietary Reference Intakes for Energy, National Academies, 2023
// (https://doi.org/10.17226/26818), TEE equations: kcal/d from age in years, height in cm, weight in kg.
const ADULT_EQUATIONS: Record<FormulaSex, Record<ActivityLevel, Equation>> = {
  MALE: {
    INACTIVE: { intercept: 753.07, age: -10.83, height: 6.5, weight: 14.1 },
    LOW_ACTIVE: { intercept: 581.47, age: -10.83, height: 8.3, weight: 14.94 },
    ACTIVE: { intercept: 1004.82, age: -10.83, height: 6.52, weight: 15.91 },
    VERY_ACTIVE: {
      intercept: -517.88,
      age: -10.83,
      height: 15.61,
      weight: 19.11,
    },
  },
  FEMALE: {
    INACTIVE: { intercept: 584.9, age: -7.01, height: 5.72, weight: 11.71 },
    LOW_ACTIVE: { intercept: 575.77, age: -7.01, height: 6.6, weight: 12.14 },
    ACTIVE: { intercept: 710.25, age: -7.01, height: 6.54, weight: 12.34 },
    VERY_ACTIVE: { intercept: 511.83, age: -7.01, height: 9.07, weight: 12.56 },
  },
}

const AGES_3_18_EQUATIONS: Record<
  FormulaSex,
  Record<ActivityLevel, Equation>
> = {
  MALE: {
    INACTIVE: { intercept: -447.51, age: 3.68, height: 13.01, weight: 13.15 },
    LOW_ACTIVE: { intercept: 19.12, age: 3.68, height: 8.62, weight: 20.28 },
    ACTIVE: { intercept: -388.19, age: 3.68, height: 12.66, weight: 20.46 },
    VERY_ACTIVE: {
      intercept: -671.75,
      age: 3.68,
      height: 15.38,
      weight: 23.25,
    },
  },
  FEMALE: {
    INACTIVE: { intercept: 55.59, age: -22.25, height: 8.43, weight: 17.07 },
    LOW_ACTIVE: {
      intercept: -297.54,
      age: -22.25,
      height: 12.77,
      weight: 14.73,
    },
    ACTIVE: { intercept: -189.55, age: -22.25, height: 11.74, weight: 18.34 },
    VERY_ACTIVE: {
      intercept: -709.59,
      age: -22.25,
      height: 18.22,
      weight: 14.25,
    },
  },
}

const ADULT_FROM_AGE = 19
const MIN_SUPPORTED_AGE = 3
const MAX_SUPPORTED_AGE = 70

// Energy cost of growth, kcal/d, added to TEE for ages 3-18 (Table 5-15 of the report).
function growthEnergyCost(ageYears: number, formulaSex: FormulaSex) {
  const isMale = formulaSex === 'MALE'
  if (ageYears < 4) return isMale ? 20 : 15
  if (ageYears < 9) return 15
  if (ageYears < 14) return isMale ? 25 : 30
  return 20
}

export function methodForAge(ageYears: number): CalculationMethod | null {
  if (ageYears < MIN_SUPPORTED_AGE) return null
  return ageYears < ADULT_FROM_AGE ? 'DRI_2023_AGES_3_18' : 'DRI_2023_ADULT'
}

// Which method belongs to an age is a different question from whether a new estimate is offered:
// a stored goal stays valid when the person passes MAX_SUPPORTED_AGE.
export function canEstimateEnergy(ageYears: number) {
  return methodForAge(ageYears) !== null && ageYears <= MAX_SUPPORTED_AGE
}

// Includes the growth allowance below 19.
export function estimateMaintenanceEnergy({
  ageYears,
  heightCm,
  weightKg,
  activityLevel,
  formulaSex,
}: EnergyInput): EnergyEstimate | null {
  const method = methodForAge(ageYears)
  if (!method || !canEstimateEnergy(ageYears)) return null

  const isAdult = method === 'DRI_2023_ADULT'
  const equations = isAdult ? ADULT_EQUATIONS : AGES_3_18_EQUATIONS
  const { intercept, age, height, weight } =
    equations[formulaSex][activityLevel]
  const growth = isAdult ? 0 : growthEnergyCost(ageYears, formulaSex)
  const kcal =
    intercept + age * ageYears + height * heightCm + weight * weightKg + growth
  return { maintenanceKcal: Math.round(kcal), method }
}
