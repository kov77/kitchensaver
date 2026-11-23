import type { AllergenCode, AllergyItem } from '@/core/types'

import {
  ALLERGEN_CODES,
  ANSWER_ALLERGY_STATUS,
  OTHER_ALLERGEN_CODE,
} from './constants'
import type { AllergenSelection } from './schemas'
import type { AllergyAnswerValue, WarnedAnswer } from './types'

export function buildAllergyItems({
  allergens,
  otherLabel,
}: AllergenSelection): AllergyItem[] {
  return allergens.map((allergenCode) =>
    allergenCode === OTHER_ALLERGEN_CODE
      ? { allergenCode, customLabel: otherLabel }
      : { allergenCode },
  )
}

export function hasWarning(
  answer: AllergyAnswerValue | null,
): answer is WarnedAnswer {
  return answer !== null && answer in ANSWER_ALLERGY_STATUS
}

export function toggleAllergen(
  selected: readonly AllergenCode[],
  code: AllergenCode,
) {
  return selected.includes(code)
    ? selected.filter((selectedCode) => selectedCode !== code)
    : [...selected, code]
}

export function getAddableCodes(listedCodes: readonly AllergenCode[]) {
  return ALLERGEN_CODES.filter(
    (code) => code === OTHER_ALLERGEN_CODE || !listedCodes.includes(code),
  )
}
