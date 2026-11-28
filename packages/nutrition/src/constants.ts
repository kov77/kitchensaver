export const GOAL_PACES = ['MILD', 'MODERATE'] as const

export const DAILY_KCAL_ISSUES = [
  'BELOW_BLOCKED_MINIMUM',
  'BELOW_ADVISED_MINIMUM',
  'ABOVE_ADVISED_MAXIMUM',
  'DEFICIT_ABOVE_ADVISED_RANGE',
  'SURPLUS_ABOVE_ADVISED_RANGE',
] as const

export const DAILY_KCAL_LIMITS = {
  blockedMinimum: 800,
  advisedMinimum: 1200,
  advisedMaximum: 3200,
  advisedMaximumDeficit: 1000,
  advisedMaximumSurplus: 500,
} as const

export const FOOD_STATES = ['RAW', 'COOKED'] as const

export const AMOUNT_UNITS = ['G', 'ML'] as const

export const FOOD_LIMITS = {
  maxIngredientGrams: 5000,
  minYieldFactor: 0.05,
  maxYieldFactor: 10,
  maxKcalPer100g: 900,
  maxMacroGramsPer100g: 100,
  macroGramsTolerance: 1,
} as const

export const NUTRITION_INPUT_ERROR_CODES = [
  'GRAMS_NOT_FINITE',
  'GRAMS_OUT_OF_RANGE',
  'FOOD_VALUES_INVALID',
  'FOOD_STATE_MISMATCH',
  'YIELD_FACTOR_INVALID',
  'YIELD_ON_COOKED_GRAMS',
  'DENSITY_REQUIRED',
  'DENSITY_INVALID',
  'RECIPE_EMPTY',
] as const
