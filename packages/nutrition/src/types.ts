import type {
  ALLERGEN_CODES,
  ALLERGEN_EVIDENCES,
  ALLERGY_STATUSES,
  AMOUNT_UNITS,
  CHECK_REASON_CODES,
  CHECK_VERDICTS,
  FOOD_STATES,
  NUTRITION_INPUT_ERROR_CODES,
  POSSIBLE_ALLERGEN_BASES,
  UNKNOWN_ALLERGEN_REASONS,
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

export type AllergenEvidence = (typeof ALLERGEN_EVIDENCES)[number]

export type UnknownAllergenReason = (typeof UNKNOWN_ALLERGEN_REASONS)[number]

export type PossibleAllergenBasis = (typeof POSSIBLE_ALLERGEN_BASES)[number]

export interface PossibleAllergen {
  code: AllergenCode
  basis: PossibleAllergenBasis
}

export type AllergenMetadata =
  | {
      status: 'KNOWN'
      evidence: AllergenEvidence
      allergens: readonly AllergenCode[]
      mayContain: readonly AllergenCode[]
      otherAllergenLabels: readonly string[]
    }
  | {
      status: 'UNKNOWN'
      reason: UnknownAllergenReason
      possibleAllergens: readonly PossibleAllergen[]
    }

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
  possibleAllergens: AllergenCode[]
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
