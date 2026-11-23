import type { Allergy } from '@/api/types'
import { OTHER_ALLERGEN_CODE } from '@/components/organisms/allergy/constants'
import type { AllergyItem } from '@/core/types'

function normalizeLabel(label: string) {
  return label.trim().toLowerCase()
}

function isListed(item: AllergyItem, { allergenCode, customLabel }: Allergy) {
  if (item.allergenCode !== allergenCode) return false
  if (item.allergenCode !== OTHER_ALLERGEN_CODE) return true
  return (
    customLabel !== null &&
    normalizeLabel(item.customLabel) === normalizeLabel(customLabel)
  )
}

export function getNewAllergyItems(
  items: readonly AllergyItem[],
  allergies: readonly Allergy[],
) {
  return items.filter(
    (item) => !allergies.some((allergy) => isListed(item, allergy)),
  )
}
