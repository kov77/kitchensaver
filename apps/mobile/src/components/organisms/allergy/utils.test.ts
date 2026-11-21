import { ALLERGEN_CODES, ALLERGY_ANSWER } from './constants'
import {
  buildAllergyItems,
  getAddableCodes,
  hasWarning,
  toggleAllergen,
} from './utils'

describe('hasWarning', () => {
  it.each([ALLERGY_ANSWER.NO, ALLERGY_ANSWER.UNKNOWN])(
    'warns before saving the answer %s',
    (answer) => {
      expect(hasWarning(answer)).toBe(true)
    },
  )

  it.each([ALLERGY_ANSWER.YES, null])('does not warn for %s', (answer) => {
    expect(hasWarning(answer)).toBe(false)
  })
})

describe('buildAllergyItems', () => {
  it('adds the custom label only for the other allergen', () => {
    expect(
      buildAllergyItems({ allergens: ['PEANUT', 'OTHER'], otherLabel: 'Kiwi' }),
    ).toEqual([
      { allergenCode: 'PEANUT' },
      { allergenCode: 'OTHER', customLabel: 'Kiwi' },
    ])
  })

  it('returns nothing when no allergen is selected', () => {
    expect(buildAllergyItems({ allergens: [], otherLabel: 'Kiwi' })).toEqual([])
  })
})

describe('toggleAllergen', () => {
  it('adds an allergen that is not selected', () => {
    expect(toggleAllergen(['MILK'], 'EGG')).toEqual(['MILK', 'EGG'])
  })

  it('removes an allergen that is selected', () => {
    expect(toggleAllergen(['MILK', 'EGG'], 'MILK')).toEqual(['EGG'])
  })

  it('leaves the original selection untouched', () => {
    const selected = ['MILK'] as const

    toggleAllergen(selected, 'EGG')

    expect(selected).toEqual(['MILK'])
  })
})

describe('getAddableCodes', () => {
  it('offers every allergen when none is listed', () => {
    expect(getAddableCodes([])).toEqual(ALLERGEN_CODES)
  })

  it('leaves out the listed allergens and keeps the order of the rest', () => {
    const addable = getAddableCodes(['MILK', 'PEANUT'])

    expect(addable).not.toContain('MILK')
    expect(addable).not.toContain('PEANUT')
    expect(addable).toEqual(
      ALLERGEN_CODES.filter((code) => code !== 'MILK' && code !== 'PEANUT'),
    )
  })

  it('always offers Other because each custom allergy has its own label', () => {
    expect(getAddableCodes(['OTHER'])).toContain('OTHER')
  })
})
