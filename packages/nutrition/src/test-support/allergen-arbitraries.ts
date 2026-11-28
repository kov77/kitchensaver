import * as fastCheck from 'fast-check'

import { ALLERGEN_CODES } from '../constants.js'
import type {
  AllergenCode,
  CheckedIngredient,
  PersonRestrictions,
} from '../types.js'

export const namedAllergenCodes = ALLERGEN_CODES.filter(
  (code): code is Exclude<AllergenCode, 'OTHER'> => code !== 'OTHER',
)

export const allergenCodeArbitrary = fastCheck.constantFrom(
  ...namedAllergenCodes,
)

const nameArbitrary = fastCheck.constantFrom(
  'rice',
  'chicken',
  'peanut butter',
  'soy sauce',
  'cilantro',
  'kiwi',
  'olive oil',
)

export function knownIngredientArbitrary(
  allergens: fastCheck.Arbitrary<readonly AllergenCode[]>,
) {
  return fastCheck
    .record({
      id: fastCheck.uuid(),
      names: fastCheck.array(nameArbitrary, { minLength: 1, maxLength: 3 }),
      allergens,
      mayContain: fastCheck.array(allergenCodeArbitrary, { maxLength: 2 }),
    })
    .map(({ id, names, allergens: known, mayContain }): CheckedIngredient => ({
      id,
      names,
      allergenMetadata: {
        status: 'KNOWN',
        allergens: known,
        mayContain,
        otherAllergenLabels: [],
      },
    }))
}

export const unknownIngredientArbitrary = fastCheck
  .record({
    id: fastCheck.uuid(),
    names: fastCheck.array(nameArbitrary, { minLength: 1, maxLength: 3 }),
  })
  .map(({ id, names }): CheckedIngredient => ({
    id,
    names,
    allergenMetadata: { status: 'UNKNOWN' },
  }))

export const anyIngredientArbitrary = fastCheck.oneof(
  knownIngredientArbitrary(
    fastCheck.array(allergenCodeArbitrary, { maxLength: 3 }),
  ),
  unknownIngredientArbitrary,
)

export const anyAllergyStatusArbitrary = fastCheck.constantFrom(
  null,
  'HAS_ALLERGIES',
  'NONE',
  'UNKNOWN',
) satisfies fastCheck.Arbitrary<PersonRestrictions['allergyStatus']>

export function allergiesArbitrary(minLength: number) {
  return fastCheck.array(
    allergenCodeArbitrary.map((allergenCode) => ({
      allergenCode,
      label: '',
    })),
    { minLength, maxLength: 3 },
  )
}
