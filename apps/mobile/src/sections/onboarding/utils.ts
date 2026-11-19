import type { OnboardingBody } from '@/api/types'
import { toIsoDate } from '@/utils/dates'

import { ALLERGY_ANSWER, OTHER_ALLERGEN_CODE } from './constants'
import type { AllergyValues } from './schemas'

type ProfileSubmission = { name: string; dateOfBirth: Date }

function buildAllergies({
  answer,
  allergens,
  otherLabel,
}: AllergyValues): OnboardingBody['allergies'] {
  if (answer === ALLERGY_ANSWER.NO) {
    return { status: 'NONE', warningAcknowledged: true }
  }
  if (answer === ALLERGY_ANSWER.UNKNOWN) {
    return { status: 'UNKNOWN', warningAcknowledged: true }
  }
  if (answer !== ALLERGY_ANSWER.YES) {
    throw new Error('The allergy question must be answered')
  }
  return {
    status: 'HAS_ALLERGIES',
    items: allergens.map((allergenCode) =>
      allergenCode === OTHER_ALLERGEN_CODE
        ? { allergenCode, customLabel: otherLabel }
        : { allergenCode },
    ),
  }
}

export function buildOnboardingBody(
  { name, dateOfBirth }: ProfileSubmission,
  allergies: AllergyValues,
): OnboardingBody {
  return {
    name,
    dateOfBirth: toIsoDate(dateOfBirth),
    allergies: buildAllergies(allergies),
  }
}
