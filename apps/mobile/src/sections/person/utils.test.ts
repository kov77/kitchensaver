import type { Allergy } from '@/api/types'
import type { AllergyItem } from '@/core/types'

import { getNewAllergyItems } from './utils'

function listed(
  allergenCode: Allergy['allergenCode'],
  customLabel: string | null = null,
): Allergy {
  return {
    id: `${allergenCode}-${customLabel}`,
    allergenCode,
    customLabel,
    resolved: customLabel === null,
    createdAt: '2026-11-01T10:00:00.000Z',
  }
}

const MILK: AllergyItem = { allergenCode: 'MILK' }
const KIWI: AllergyItem = { allergenCode: 'OTHER', customLabel: 'Kiwi' }

describe('getNewAllergyItems', () => {
  it('keeps everything when nothing is listed', () => {
    expect(getNewAllergyItems([MILK, KIWI], [])).toEqual([MILK, KIWI])
  })

  it('drops an allergen that is already listed', () => {
    expect(getNewAllergyItems([MILK, KIWI], [listed('MILK')])).toEqual([KIWI])
  })

  it('drops the other allergy with the same label', () => {
    expect(getNewAllergyItems([MILK, KIWI], [listed('OTHER', 'Kiwi')])).toEqual(
      [MILK],
    )
  })

  it('ignores case and spaces around the label', () => {
    expect(getNewAllergyItems([KIWI], [listed('OTHER', '  kIWi ')])).toEqual([])
  })

  it('keeps an other allergy with a different label', () => {
    expect(getNewAllergyItems([KIWI], [listed('OTHER', 'Mango')])).toEqual([
      KIWI,
    ])
  })

  it('does not treat a listed ordinary allergen as the other allergy', () => {
    expect(getNewAllergyItems([KIWI], [listed('MILK')])).toEqual([KIWI])
  })

  it('returns nothing when everything is already listed', () => {
    expect(
      getNewAllergyItems(
        [MILK, KIWI],
        [listed('MILK'), listed('OTHER', 'Kiwi')],
      ),
    ).toEqual([])
  })
})
