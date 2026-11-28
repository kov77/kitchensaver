import type {
  ALLERGEN_CODES,
  ALLERGY_STATUSES,
  AMOUNT_UNITS,
  CHECK_REASON_CODES,
  CHECK_VERDICTS,
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

export type AllergenCode = (typeof ALLERGEN_CODES)[number]

export type AllergyStatus = (typeof ALLERGY_STATUSES)[number]

export type CheckVerdict = (typeof CHECK_VERDICTS)[number]

export type CheckReasonCode = (typeof CHECK_REASON_CODES)[number]

export type AllergenMetadata =
  | {
      status: 'KNOWN'
      allergens: readonly AllergenCode[]
      mayContain: readonly AllergenCode[]
      otherAllergenLabels: readonly string[]
    }
  | { status: 'UNKNOWN' }

export interface CheckedIngredient {
  id: string
  names: readonly string[]
  allergenMetadata: AllergenMetadata
}

export interface PersonRestrictions {
  allergyStatus: AllergyStatus | null
  allergies: readonly { allergenCode: AllergenCode; label: string }[]
  exclusions: readonly string[]
}

export interface CheckReason {
  code: CheckReasonCode
  ingredientId?: string
  allergenCode?: AllergenCode
  otherPersonId?: string
}

export interface AllergenBadge {
  allergens: AllergenCode[]
  mayContainAllergens: AllergenCode[]
  unverifiedIngredientIds: string[]
}

export interface PersonCheckResult {
  verdict: CheckVerdict
  reasons: CheckReason[]
  badge: AllergenBadge
}

export interface SharedMealParticipant {
  personId: string
  restrictions: PersonRestrictions
  addOns: readonly CheckedIngredient[]
}

export interface SharedMealParticipantResult {
  personId: string
  result: PersonCheckResult
}
