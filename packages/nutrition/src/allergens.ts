import { NutritionInputError } from './errors.js'
import { normalizeName } from './normalize-name.js'
import type {
  AllergenBadge,
  AllergenCode,
  CheckedIngredient,
  CheckReason,
  CheckVerdict,
  PersonCheckResult,
  PersonRestrictions,
} from './types.js'

const OTHER_ALLERGEN: AllergenCode = 'OTHER'

function namesOf({ names }: CheckedIngredient) {
  return new Set(names.map(normalizeName))
}

function unique<Value>(values: readonly Value[]) {
  return [...new Set(values)]
}

function buildBadge(ingredients: readonly CheckedIngredient[]): AllergenBadge {
  const allergens: AllergenCode[] = []
  const mayContainAllergens: AllergenCode[] = []
  const unverifiedIngredientIds: string[] = []
  for (const { id, allergenMetadata } of ingredients) {
    if (allergenMetadata.status === 'UNKNOWN') {
      unverifiedIngredientIds.push(id)
      continue
    }
    allergens.push(...allergenMetadata.allergens)
    mayContainAllergens.push(...allergenMetadata.mayContain)
  }
  return {
    allergens: unique(allergens),
    mayContainAllergens: unique(mayContainAllergens),
    unverifiedIngredientIds: unique(unverifiedIngredientIds),
  }
}

function checkIngredient(
  ingredient: CheckedIngredient,
  { allergies, exclusions }: PersonRestrictions,
): CheckReason[] {
  const { id: ingredientId, allergenMetadata } = ingredient
  const names = namesOf(ingredient)
  const otherLabels = new Set(
    allergenMetadata.status === 'KNOWN'
      ? allergenMetadata.otherAllergenLabels.map(normalizeName)
      : [],
  )
  const otherAllergies = allergies.filter(
    ({ allergenCode }) => allergenCode === OTHER_ALLERGEN,
  )
  const reasons: CheckReason[] = []

  for (const exclusion of exclusions) {
    const normalized = normalizeName(exclusion)
    if (normalized !== '' && names.has(normalized)) {
      reasons.push({ code: 'EXCLUDED_INGREDIENT', ingredientId })
    }
  }

  for (const { allergenCode, label } of otherAllergies) {
    const normalized = normalizeName(label)
    if (normalized === '') continue
    if (names.has(normalized) || otherLabels.has(normalized)) {
      reasons.push({ code: 'ALLERGEN_PRESENT', ingredientId, allergenCode })
    }
  }

  if (allergenMetadata.status === 'UNKNOWN') {
    if (allergies.length > 0 || exclusions.length > 0) {
      reasons.push({ code: 'UNVERIFIED_INGREDIENT', ingredientId })
    }
    return reasons
  }

  const hidesOtherAllergen =
    allergenMetadata.allergens.includes(OTHER_ALLERGEN) ||
    allergenMetadata.mayContain.includes(OTHER_ALLERGEN)
  if (otherAllergies.length > 0 && hidesOtherAllergen) {
    reasons.push({ code: 'UNVERIFIED_INGREDIENT', ingredientId })
  }

  for (const { allergenCode } of allergies) {
    if (allergenCode === OTHER_ALLERGEN) continue
    if (allergenMetadata.allergens.includes(allergenCode)) {
      reasons.push({ code: 'ALLERGEN_PRESENT', ingredientId, allergenCode })
    } else if (allergenMetadata.mayContain.includes(allergenCode)) {
      reasons.push({ code: 'ALLERGEN_MAY_CONTAIN', ingredientId, allergenCode })
    }
  }
  return reasons
}

function checkRestrictionLabels({
  allergies,
  exclusions,
}: PersonRestrictions): CheckReason[] {
  const hasEmptyLabel =
    exclusions.some((exclusion) => normalizeName(exclusion) === '') ||
    allergies.some(
      ({ allergenCode, label }) =>
        allergenCode === OTHER_ALLERGEN && normalizeName(label) === '',
    )
  return hasEmptyLabel ? [{ code: 'RESTRICTION_LABEL_EMPTY' }] : []
}

function checkAllergyAnswer({
  allergyStatus,
  allergies,
}: PersonRestrictions): CheckReason[] {
  if (allergyStatus === null) return [{ code: 'ALLERGY_STATUS_MISSING' }]
  if (allergyStatus === 'UNKNOWN') return [{ code: 'ALLERGY_STATUS_UNKNOWN' }]
  if (allergyStatus === 'HAS_ALLERGIES' && allergies.length === 0) {
    return [{ code: 'ALLERGY_DATA_INCONSISTENT' }]
  }
  return []
}

const BLOCKING_REASON_CODES: readonly CheckReason['code'][] = [
  'ALLERGEN_PRESENT',
  'ALLERGEN_MAY_CONTAIN',
  'EXCLUDED_INGREDIENT',
  'ADD_ON_CONFLICTS_WITH_PARTICIPANT',
]

export function toVerdict(reasons: readonly CheckReason[]): CheckVerdict {
  if (reasons.some(({ code }) => BLOCKING_REASON_CODES.includes(code))) {
    return 'BLOCKED'
  }
  return reasons.length > 0 ? 'NEEDS_VERIFICATION' : 'NO_KNOWN_CONFLICT'
}

export function checkIngredientsForPerson(
  ingredients: readonly CheckedIngredient[],
  restrictions: PersonRestrictions,
): PersonCheckResult {
  if (ingredients.length === 0) throw new NutritionInputError('RECIPE_EMPTY')

  const reasons = [
    ...checkAllergyAnswer(restrictions),
    ...checkRestrictionLabels(restrictions),
    ...ingredients.flatMap((ingredient) =>
      checkIngredient(ingredient, restrictions),
    ),
  ]
  return {
    verdict: toVerdict(reasons),
    reasons,
    badge: buildBadge(ingredients),
  }
}
