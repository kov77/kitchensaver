import type { OnboardingBody } from '@/api/types'
import type { GoalDraft } from '@/core/types'
import { toIsoDate } from '@/utils/dates'
import { toSaveGoalBody } from '@/utils/goal'

import {
  ALLERGY_ANSWER,
  OTHER_ALLERGEN_CODE,
  WARNING_DIALOGS,
} from './constants'
import type { AllergyValues } from './schemas'
import type { FlowAction, FlowState } from './types'

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
  goal: GoalDraft | null,
  allergies: AllergyValues,
): OnboardingBody {
  return {
    name,
    dateOfBirth: toIsoDate(dateOfBirth),
    ...(goal && { goal: toSaveGoalBody(goal) }),
    allergies: buildAllergies(allergies),
  }
}

export function getWarningDialog(values: AllergyValues | null) {
  if (values?.answer === ALLERGY_ANSWER.NO) {
    return WARNING_DIALOGS[ALLERGY_ANSWER.NO]
  }
  if (values?.answer === ALLERGY_ANSWER.UNKNOWN) {
    return WARNING_DIALOGS[ALLERGY_ANSWER.UNKNOWN]
  }
  return null
}

export function onboardingFlowReducer(
  state: FlowState,
  action: FlowAction,
): FlowState {
  if (action.type === 'profileSubmitted') {
    return { step: 'goal', profile: action.profile }
  }
  if (action.type === 'goalChosen') {
    if (state.step !== 'goal') return state
    return { step: 'allergies', profile: state.profile, goal: action.goal }
  }
  if (state.step === 'allergies') {
    return { step: 'goal', profile: state.profile }
  }
  if (state.step === 'goal') {
    return { step: 'profile', profile: state.profile }
  }
  return state
}
