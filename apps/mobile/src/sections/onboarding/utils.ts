import type { OnboardingBody } from '@/api/types'
import {
  ALLERGY_ANSWER,
  ANSWER_ALLERGY_STATUS,
} from '@/components/organisms/allergy/constants'
import type { AllergyAnswerValues } from '@/components/organisms/allergy/schemas'
import {
  buildAllergyItems,
  hasWarning,
} from '@/components/organisms/allergy/utils'
import type { GoalDraft } from '@/core/types'
import { toIsoDate } from '@/utils/dates'
import { toSaveGoalBody } from '@/utils/goal'

import type { FlowAction, FlowState } from './types'

type ProfileSubmission = { name: string; dateOfBirth: Date }

function buildAllergies(
  values: AllergyAnswerValues,
): OnboardingBody['allergies'] {
  if (hasWarning(values.answer)) {
    return {
      status: ANSWER_ALLERGY_STATUS[values.answer],
      warningAcknowledged: true,
    }
  }
  if (values.answer !== ALLERGY_ANSWER.YES) {
    throw new Error('The allergy question must be answered')
  }
  return {
    status: 'HAS_ALLERGIES',
    items: buildAllergyItems(values),
  }
}

export function buildOnboardingBody(
  { name, dateOfBirth }: ProfileSubmission,
  goal: GoalDraft | null,
  allergies: AllergyAnswerValues,
): OnboardingBody {
  return {
    name,
    dateOfBirth: toIsoDate(dateOfBirth),
    ...(goal && { goal: toSaveGoalBody(goal) }),
    allergies: buildAllergies(allergies),
  }
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
