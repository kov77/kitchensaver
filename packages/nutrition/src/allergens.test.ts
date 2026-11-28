import * as fastCheck from 'fast-check'
import { describe, expect, test } from 'vitest'

import {
  checkIngredientsForPerson,
  isEligibleForAutoPlan,
} from './allergens.js'
import {
  ALLERGEN_CODES,
  ALLERGEN_EVIDENCES,
  ALLERGY_STATUSES,
  CHECK_REASON_CODES,
  CHECK_VERDICTS,
  POSSIBLE_ALLERGEN_BASES,
  UNKNOWN_ALLERGEN_REASONS,
} from './constants.js'
import golden from './golden/allergens.json' with { type: 'json' }
import {
  allergenCodeArbitrary,
  allergiesArbitrary,
  anyAllergyStatusArbitrary,
  anyIngredientArbitrary,
  knownIngredientArbitrary,
  unknownIngredientArbitrary,
} from './test-support/allergen-arbitraries.js'
import { codeOf } from './test-support/arbitraries.js'
import { narrow } from './test-support/narrow.js'
import type {
  AllergenCode,
  AllergenMetadata,
  CheckedIngredient,
  PersonRestrictions,
} from './types.js'

interface GoldenMetadata {
  status: string
  evidence?: string
  reason?: string
  possibleAllergens?: { code: string; basis: string }[]
  allergens?: string[]
  mayContain?: string[]
  otherAllergenLabels?: string[]
}

function toMetadata({
  status,
  evidence = '',
  reason = '',
  possibleAllergens = [],
  allergens = [],
  mayContain = [],
  otherAllergenLabels = [],
}: GoldenMetadata): AllergenMetadata {
  if (status === 'UNKNOWN') {
    return {
      status: 'UNKNOWN',
      reason: narrow(UNKNOWN_ALLERGEN_REASONS, reason),
      possibleAllergens: possibleAllergens.map(({ code, basis }) => ({
        code: narrow(ALLERGEN_CODES, code),
        basis: narrow(POSSIBLE_ALLERGEN_BASES, basis),
      })),
    }
  }
  return {
    status: 'KNOWN',
    evidence: narrow(ALLERGEN_EVIDENCES, evidence),
    allergens: allergens.map((code) => narrow(ALLERGEN_CODES, code)),
    mayContain: mayContain.map((code) => narrow(ALLERGEN_CODES, code)),
    otherAllergenLabels,
  }
}

function toIngredient(key: string): CheckedIngredient {
  const entry = Object.entries(golden.ingredients).find(
    ([candidate]) => candidate === key,
  )
  if (!entry) throw new Error(`Unknown ingredient in the golden file: ${key}`)
  const { id, names, metadata } = entry[1]
  return { id, names, allergenMetadata: toMetadata(metadata) }
}

function toRestrictions({
  allergyStatus,
  allergies,
  exclusions,
}: (typeof golden.cases)[number]['restrictions']): PersonRestrictions {
  return {
    allergyStatus:
      allergyStatus === null ? null : narrow(ALLERGY_STATUSES, allergyStatus),
    allergies: allergies.map(({ allergenCode, label }) => ({
      allergenCode: narrow(ALLERGEN_CODES, allergenCode),
      label,
    })),
    exclusions,
  }
}

describe('checkIngredientsForPerson golden cases', () => {
  test.each(golden.cases)(
    '$name',
    ({ ingredients, restrictions, expected }) => {
      const result = checkIngredientsForPerson(
        ingredients.map(toIngredient),
        toRestrictions(restrictions),
      )

      expect(result.verdict).toBe(narrow(CHECK_VERDICTS, expected.verdict))
      expect(result.reasons.map(({ code }) => code)).toEqual(
        expected.reasonCodes.map((code) => narrow(CHECK_REASON_CODES, code)),
      )
      expect(result.badge.allergens).toEqual(expected.badgeAllergens)
    },
  )
})

function possiblyContaining(
  id: string,
  allergenCode: AllergenCode,
): CheckedIngredient {
  return {
    id,
    names: [id],
    allergenMetadata: {
      status: 'UNKNOWN',
      reason: 'BRAND_DEPENDENT',
      possibleAllergens: [{ code: allergenCode, basis: 'TYPICAL_FORMULATION' }],
    },
  }
}

describe('isEligibleForAutoPlan', () => {
  test.each([
    ['BLOCKED', false],
    ['NEEDS_VERIFICATION', false],
    ['NO_KNOWN_CONFLICT', true],
  ] as const)('%s gives %s', (verdict, expected) => {
    expect(isEligibleForAutoPlan({ verdict })).toBe(expected)
  })

  test('a possible allergen that matches an allergy never reaches an automatic plan', () => {
    fastCheck.assert(
      fastCheck.property(
        allergenCodeArbitrary,
        fastCheck.array(knownIngredientArbitrary(fastCheck.constant([])), {
          maxLength: 3,
        }),
        (allergenCode, others) => {
          const result = checkIngredientsForPerson(
            [...others, possiblyContaining('brand-sauce', allergenCode)],
            {
              allergyStatus: 'HAS_ALLERGIES',
              allergies: [{ allergenCode, label: '' }],
              exclusions: [],
            },
          )
          return (
            !isEligibleForAutoPlan(result) &&
            result.reasons.some(({ code }) => code === 'ALLERGEN_POSSIBLE')
          )
        },
      ),
    )
  })

  test('a missing allergen in the possible list never gives a clean verdict to an allergic person', () => {
    fastCheck.assert(
      fastCheck.property(
        allergenCodeArbitrary,
        fastCheck.array(allergenCodeArbitrary, { maxLength: 4 }),
        (allergenCode, possible) => {
          const result = checkIngredientsForPerson(
            [
              {
                id: 'brand-sauce',
                names: ['brand sauce'],
                allergenMetadata: {
                  status: 'UNKNOWN',
                  reason: 'BRAND_DEPENDENT',
                  possibleAllergens: possible
                    .filter((code) => code !== allergenCode)
                    .map((code) => ({
                      code,
                      basis: 'TYPICAL_FORMULATION' as const,
                    })),
                },
              },
            ],
            {
              allergyStatus: 'HAS_ALLERGIES',
              allergies: [{ allergenCode, label: '' }],
              exclusions: [],
            },
          )
          return result.verdict === 'NEEDS_VERIFICATION'
        },
      ),
    )
  })
})

describe('checkIngredientsForPerson', () => {
  const rice = toIngredient('rice')

  test('refuses a recipe without ingredients', () => {
    expect(
      codeOf(() =>
        checkIngredientsForPerson([], {
          allergyStatus: 'NONE',
          allergies: [],
          exclusions: [],
        }),
      ),
    ).toBe('RECIPE_EMPTY')
  })

  test('lists unverified ingredients and recipe allergens for the badge', () => {
    const result = checkIngredientsForPerson(
      ['peanutButter', 'granola', 'mysterySauce'].map(toIngredient),
      { allergyStatus: 'UNKNOWN', allergies: [], exclusions: [] },
    )

    expect(result.badge).toEqual({
      allergens: ['PEANUT', 'WHEAT'],
      mayContainAllergens: ['TREE_NUT'],
      possibleAllergens: [],
      unverifiedIngredientIds: ['mystery-sauce'],
    })
  })

  test('reports the possible allergens of unknown ingredients in the badge', () => {
    const result = checkIngredientsForPerson(
      ['rice', 'brandSoySauce'].map(toIngredient),
      { allergyStatus: 'NONE', allergies: [], exclusions: [] },
    )

    expect(result.badge.possibleAllergens).toEqual(['SOY', 'WHEAT'])
    expect(result.badge.allergens).toEqual([])
    expect(result.badge.unverifiedIngredientIds).toEqual(['brand-soy-sauce'])
  })

  test('points at the ingredient and the allergen that caused the block', () => {
    const result = checkIngredientsForPerson(
      [rice, toIngredient('peanutButter')],
      {
        allergyStatus: 'HAS_ALLERGIES',
        allergies: [{ allergenCode: 'PEANUT', label: '' }],
        exclusions: [],
      },
    )

    expect(result.reasons).toEqual([
      {
        code: 'ALLERGEN_PRESENT',
        ingredientId: 'peanut-butter',
        allergenCode: 'PEANUT',
      },
    ])
  })
})

describe('allergen invariants', () => {
  test('a person allergic to X is always blocked when any ingredient contains X', () => {
    const scenario = fastCheck
      .record({
        before: fastCheck.array(anyIngredientArbitrary, { maxLength: 4 }),
        carrier: knownIngredientArbitrary(
          allergenCodeArbitrary.map((code) => [code]),
        ),
        after: fastCheck.array(anyIngredientArbitrary, { maxLength: 4 }),
        status: anyAllergyStatusArbitrary,
        exclusions: fastCheck.array(fastCheck.string(), { maxLength: 2 }),
      })
      .map((parts) => {
        const { allergens } =
          parts.carrier.allergenMetadata.status === 'KNOWN'
            ? parts.carrier.allergenMetadata
            : { allergens: [] }
        return { ...parts, allergen: allergens[0] }
      })

    fastCheck.assert(
      fastCheck.property(
        scenario,
        ({ before, carrier, after, status, exclusions, allergen }) =>
          allergen !== undefined &&
          checkIngredientsForPerson([...before, carrier, ...after], {
            allergyStatus: status,
            allergies: [{ allergenCode: allergen, label: '' }],
            exclusions,
          }).verdict === 'BLOCKED',
      ),
    )
  })

  test('an unknown ingredient never gives no-known-conflict to a person with an allergy', () => {
    fastCheck.assert(
      fastCheck.property(
        fastCheck.array(anyIngredientArbitrary, { maxLength: 4 }),
        unknownIngredientArbitrary,
        allergiesArbitrary(1),
        anyAllergyStatusArbitrary,
        (others, unknown, allergies, status) =>
          checkIngredientsForPerson([...others, unknown], {
            allergyStatus: status,
            allergies,
            exclusions: [],
          }).verdict !== 'NO_KNOWN_CONFLICT',
      ),
    )
  })

  test('an unanswered or unknown allergy answer never gives no-known-conflict', () => {
    fastCheck.assert(
      fastCheck.property(
        fastCheck.array(anyIngredientArbitrary, { minLength: 1, maxLength: 5 }),
        fastCheck.constantFrom(null, 'UNKNOWN' as const),
        (ingredients, status) =>
          checkIngredientsForPerson(ingredients, {
            allergyStatus: status,
            allergies: [],
            exclusions: [],
          }).verdict !== 'NO_KNOWN_CONFLICT',
      ),
    )
  })

  test('known ingredients with no allergen of the person give no-known-conflict', () => {
    const personAllergen = 'PEANUT' as const
    const harmless = knownIngredientArbitrary(
      fastCheck.array(
        allergenCodeArbitrary.filter((code) => code !== personAllergen),
        { maxLength: 3 },
      ),
    ).map((ingredient): CheckedIngredient =>
      ingredient.allergenMetadata.status === 'KNOWN'
        ? {
            ...ingredient,
            allergenMetadata: {
              ...ingredient.allergenMetadata,
              mayContain: ingredient.allergenMetadata.mayContain.filter(
                (code) => code !== personAllergen,
              ),
            },
          }
        : ingredient,
    )

    fastCheck.assert(
      fastCheck.property(
        fastCheck.array(harmless, { minLength: 1, maxLength: 5 }),
        (ingredients) =>
          checkIngredientsForPerson(ingredients, {
            allergyStatus: 'HAS_ALLERGIES',
            allergies: [{ allergenCode: personAllergen, label: '' }],
            exclusions: [],
          }).verdict === 'NO_KNOWN_CONFLICT',
      ),
    )
  })

  test('a custom allergy blocks an ingredient with that name whatever its letter case and spacing', () => {
    const written = fastCheck.constantFrom(' Kiwi ', 'KIWI', 'kiwi', '\tkiwi  ')

    fastCheck.assert(
      fastCheck.property(
        written,
        fastCheck.array(anyIngredientArbitrary, { maxLength: 3 }),
        anyAllergyStatusArbitrary,
        (label, others, status) =>
          checkIngredientsForPerson([...others, toIngredient('kiwi')], {
            allergyStatus: status,
            allergies: [{ allergenCode: 'OTHER', label }],
            exclusions: [],
          }).verdict === 'BLOCKED',
      ),
    )
  })

  test('a custom allergy never gives no-known-conflict when an ingredient hides another allergen or is unknown', () => {
    const risky = fastCheck.oneof(
      unknownIngredientArbitrary,
      fastCheck.constant(toIngredient('trailMix')),
    )

    fastCheck.assert(
      fastCheck.property(
        fastCheck.array(anyIngredientArbitrary, { maxLength: 3 }),
        risky,
        (others, ingredient) =>
          checkIngredientsForPerson([...others, ingredient], {
            allergyStatus: 'HAS_ALLERGIES',
            allergies: [{ allergenCode: 'OTHER', label: 'sesame oil' }],
            exclusions: [],
          }).verdict !== 'NO_KNOWN_CONFLICT',
      ),
    )
  })

  test('an exclusion blocks whatever its letter case and spacing', () => {
    const scrambled = fastCheck.record({
      upper: fastCheck.boolean(),
      padding: fastCheck.constantFrom('', ' ', '  \t'),
      gap: fastCheck.constantFrom(' ', '   '),
    })

    fastCheck.assert(
      fastCheck.property(
        scrambled,
        fastCheck.array(anyIngredientArbitrary, { maxLength: 3 }),
        ({ upper, padding, gap }, others) => {
          const target: CheckedIngredient = {
            id: 'target',
            names: ['soy sauce'],
            allergenMetadata: {
              status: 'KNOWN',
              evidence: 'INHERENT',
              allergens: [],
              mayContain: [],
              otherAllergenLabels: [],
            },
          }
          const written = `${padding}${upper ? 'SOY' : 'soy'}${gap}sauce${padding}`
          return (
            checkIngredientsForPerson([...others, target], {
              allergyStatus: 'NONE',
              allergies: [],
              exclusions: [written],
            }).verdict === 'BLOCKED'
          )
        },
      ),
    )
  })
})
