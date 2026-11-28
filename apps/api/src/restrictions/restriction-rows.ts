import { normalizeName } from '@kitchensaver/nutrition'

import { AllergenCode } from '../generated/prisma/client.js'
import type {
  AddAllergyRequest,
  AddExclusionRequest,
  AddPreferenceRequest,
} from './restrictions.dto.js'

export function allergyRow(request: AddAllergyRequest) {
  if (request.allergenCode !== AllergenCode.OTHER) {
    return {
      allergenCode: request.allergenCode,
      customLabel: null,
      normalizedLabel: '',
    }
  }
  return {
    allergenCode: request.allergenCode,
    customLabel: request.customLabel,
    normalizedLabel: normalizeName(request.customLabel),
  }
}

export function exclusionRow({ ingredientName }: AddExclusionRequest) {
  return { ingredientName, normalizedName: normalizeName(ingredientName) }
}

export function preferenceRow({
  ingredientName,
  rating,
}: AddPreferenceRequest) {
  return {
    ingredientName,
    normalizedName: normalizeName(ingredientName),
    rating,
  }
}
