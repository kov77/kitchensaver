import * as fastCheck from 'fast-check'
import { describe, expect, test } from 'vitest'

import { checkSharedMeal } from './shared-meal.js'
import {
  allergenCodeArbitrary,
  knownIngredientArbitrary,
} from './test-support/allergen-arbitraries.js'
import { codeOf } from './test-support/arbitraries.js'
import type {
  AllergenCode,
  CheckedIngredient,
  PersonRestrictions,
  SharedMealParticipant,
} from './types.js'

function known(
  id: string,
  allergens: AllergenCode[] = [],
  mayContain: AllergenCode[] = [],
): CheckedIngredient {
  return {
    id,
    names: [id],
    allergenMetadata: {
      status: 'KNOWN',
      allergens,
      mayContain,
      otherAllergenLabels: [],
    },
  }
}

const unknownSauce: CheckedIngredient = {
  id: 'house-sauce',
  names: ['house sauce'],
  allergenMetadata: { status: 'UNKNOWN' },
}

function allergicTo(allergenCode: AllergenCode): PersonRestrictions {
  return {
    allergyStatus: 'HAS_ALLERGIES',
    allergies: [{ allergenCode, label: '' }],
    exclusions: [],
  }
}

const noAllergies: PersonRestrictions = {
  allergyStatus: 'NONE',
  allergies: [],
  exclusions: [],
}

function participant(
  personId: string,
  restrictions: PersonRestrictions,
  addOns: CheckedIngredient[] = [],
): SharedMealParticipant {
  return { personId, restrictions, addOns }
}

const base = [known('rice'), known('chicken')]

function resultOf(
  results: ReturnType<typeof checkSharedMeal>,
  personId: string,
) {
  const found = results.find((entry) => entry.personId === personId)
  expect(found).toBeDefined()
  return found?.result
}

describe('checkSharedMeal', () => {
  test('refuses a meal without participants', () => {
    expect(codeOf(() => checkSharedMeal(base, []))).toBe('PARTICIPANTS_EMPTY')
  })

  test('checks the shared dish for each person on their own', () => {
    const results = checkSharedMeal(
      [known('peanut-sauce', ['PEANUT'])],
      [
        participant('anna', allergicTo('PEANUT')),
        participant('ben', noAllergies),
      ],
    )

    expect(resultOf(results, 'anna')?.verdict).toBe('BLOCKED')
    expect(resultOf(results, 'ben')?.verdict).toBe('NO_KNOWN_CONFLICT')
  })

  test('blocks an add-on that contains the allergen of another participant', () => {
    const results = checkSharedMeal(base, [
      participant('anna', allergicTo('PEANUT')),
      participant('ben', noAllergies, [known('peanuts', ['PEANUT'])]),
    ])

    expect(resultOf(results, 'ben')?.verdict).toBe('BLOCKED')
    expect(resultOf(results, 'ben')?.reasons).toEqual([
      {
        code: 'ADD_ON_CONFLICTS_WITH_PARTICIPANT',
        ingredientId: 'peanuts',
        allergenCode: 'PEANUT',
        otherPersonId: 'anna',
      },
    ])
  })

  test('leaves the allergic participant untouched by the other persons add-on', () => {
    const results = checkSharedMeal(base, [
      participant('anna', allergicTo('PEANUT')),
      participant('ben', noAllergies, [known('peanuts', ['PEANUT'])]),
    ])

    expect(resultOf(results, 'anna')?.verdict).toBe('NO_KNOWN_CONFLICT')
  })

  test('treats a may-contain add-on as a conflict with an allergic participant', () => {
    const results = checkSharedMeal(base, [
      participant('anna', allergicTo('PEANUT')),
      participant('ben', noAllergies, [known('granola', [], ['PEANUT'])]),
    ])

    expect(resultOf(results, 'ben')?.verdict).toBe('BLOCKED')
  })

  test('asks for verification when an unknown add-on meets another persons allergy', () => {
    const results = checkSharedMeal(base, [
      participant('anna', allergicTo('PEANUT')),
      participant('ben', noAllergies, [unknownSauce]),
    ])

    expect(resultOf(results, 'ben')?.verdict).toBe('NEEDS_VERIFICATION')
    expect(resultOf(results, 'ben')?.reasons).toEqual([
      {
        code: 'UNVERIFIED_INGREDIENT',
        ingredientId: 'house-sauce',
        otherPersonId: 'anna',
      },
    ])
  })

  test('ignores the exclusions of another participant for an add-on', () => {
    const results = checkSharedMeal(base, [
      participant('anna', {
        allergyStatus: 'NONE',
        allergies: [],
        exclusions: ['cilantro'],
      }),
      participant('ben', noAllergies, [known('cilantro')]),
    ])

    expect(resultOf(results, 'ben')?.verdict).toBe('NO_KNOWN_CONFLICT')
  })

  test('refuses two participants with the same id', () => {
    expect(
      codeOf(() =>
        checkSharedMeal(base, [
          participant('anna', allergicTo('PEANUT')),
          participant('anna', noAllergies, [known('peanuts', ['PEANUT'])]),
        ]),
      ),
    ).toBe('PARTICIPANTS_DUPLICATE')
  })

  test('blocks the person who eats an add-on with their own allergen', () => {
    const results = checkSharedMeal(base, [
      participant('anna', allergicTo('PEANUT'), [known('peanuts', ['PEANUT'])]),
    ])

    expect(resultOf(results, 'anna')?.verdict).toBe('BLOCKED')
  })

  test('collects the conflicts with every other participant', () => {
    const results = checkSharedMeal(base, [
      participant('anna', allergicTo('PEANUT')),
      participant('ben', allergicTo('SESAME')),
      participant('cleo', noAllergies, [known('mix', ['PEANUT', 'SESAME'])]),
    ])

    expect(
      resultOf(results, 'cleo')?.reasons.map(
        ({ otherPersonId, allergenCode }) => [otherPersonId, allergenCode],
      ),
    ).toEqual([
      ['anna', 'PEANUT'],
      ['ben', 'SESAME'],
    ])
  })

  test('blocks an add-on named like the custom allergy of another participant', () => {
    const results = checkSharedMeal(base, [
      participant('anna', {
        allergyStatus: 'HAS_ALLERGIES',
        allergies: [{ allergenCode: 'OTHER', label: 'Kiwi' }],
        exclusions: [],
      }),
      participant('ben', noAllergies, [known('kiwi')]),
    ])

    expect(resultOf(results, 'ben')?.verdict).toBe('BLOCKED')
  })

  test('does not flag an unverified add-on next to a person who only has exclusions', () => {
    const results = checkSharedMeal(base, [
      participant('anna', {
        allergyStatus: 'NONE',
        allergies: [],
        exclusions: ['cilantro'],
      }),
      participant('ben', noAllergies, [unknownSauce]),
    ])

    expect(resultOf(results, 'ben')?.verdict).toBe('NO_KNOWN_CONFLICT')
  })

  test('adds the own add-on to the badge of the person who eats it', () => {
    const results = checkSharedMeal(base, [
      participant('ben', noAllergies, [known('sesame', ['SESAME'])]),
    ])

    expect(resultOf(results, 'ben')?.badge.allergens).toEqual(['SESAME'])
  })
})

describe('shared meal invariants', () => {
  test('an add-on with the allergen of another participant always blocks its owner', () => {
    fastCheck.assert(
      fastCheck.property(
        allergenCodeArbitrary,
        knownIngredientArbitrary(fastCheck.constant<AllergenCode[]>([])),
        (allergen, filler) => {
          const results = checkSharedMeal(
            [filler],
            [
              participant('first', allergicTo(allergen)),
              participant('second', noAllergies, [
                known('carrier', [allergen]),
              ]),
            ],
          )
          return resultOf(results, 'second')?.verdict === 'BLOCKED'
        },
      ),
    )
  })

  test('an add-on carrying the allergen of any other participant blocks its owner', () => {
    const allergens = fastCheck.array(allergenCodeArbitrary, {
      minLength: 1,
      maxLength: 3,
    })

    fastCheck.assert(
      fastCheck.property(
        allergens,
        fastCheck.nat({ max: 2 }),
        (others, pick) => {
          const carried = others[pick % others.length] ?? 'MILK'
          const people = [
            participant('owner', noAllergies, [known('carrier', [carried])]),
            ...others.map((allergen, index) =>
              participant(`other-${index}`, allergicTo(allergen)),
            ),
          ]
          return (
            resultOf(checkSharedMeal(base, people), 'owner')?.verdict ===
            'BLOCKED'
          )
        },
      ),
    )
  })

  test('an add-on never changes the verdict of a person who does not eat it', () => {
    fastCheck.assert(
      fastCheck.property(
        allergenCodeArbitrary,
        allergenCodeArbitrary,
        (ownerAllergen, otherAllergen) => {
          const withoutAddOn = checkSharedMeal(base, [
            participant('owner', allergicTo(ownerAllergen)),
            participant('other', allergicTo(otherAllergen)),
          ])
          const withAddOn = checkSharedMeal(base, [
            participant('owner', allergicTo(ownerAllergen)),
            participant('other', allergicTo(otherAllergen), [
              known('extra', [otherAllergen]),
            ]),
          ])
          return (
            resultOf(withAddOn, 'owner')?.verdict ===
            resultOf(withoutAddOn, 'owner')?.verdict
          )
        },
      ),
    )
  })
})
