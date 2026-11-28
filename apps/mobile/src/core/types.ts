import type {
  Allergy,
  PersonDetail,
  PersonGoal,
  PersonListItem,
  StoredBodyParameters,
} from '@/api/types'

export type AppAccess =
  | 'loading'
  | 'unavailable'
  | 'signedOut'
  | 'consentRequired'
  | 'onboardingRequired'
  | 'ready'

export type GoalType = 'LOSE' | 'MAINTAIN' | 'GAIN' | 'CUSTOM'

export type EstimatedGoalType = Exclude<GoalType, 'CUSTOM'>

export type ActivityLevel = 'INACTIVE' | 'LOW_ACTIVE' | 'ACTIVE' | 'VERY_ACTIVE'

export type FormulaSex = 'MALE' | 'FEMALE'

export type BodyParameters = Omit<StoredBodyParameters, 'updatedAt'>

export type EstimateInput = BodyParameters & {
  goalType: EstimatedGoalType
}

export type GoalPace = 'MILD' | 'MODERATE'

export type KcalSuggestion = {
  pace: GoalPace
  suggestedKcal: number
  adjustmentKcal: number
  isLimited: boolean
}

export type GoalEstimate = {
  estimatedMaintenanceKcal: number
  methodology: string
  assumptions: string[]
  kcalSuggestions: KcalSuggestion[]
}

export type GoalDraft = (
  | { mode: 'MANUAL'; goalType: GoalType; dailyKcal: number }
  | ({ mode: 'ESTIMATED'; dailyKcal: number } & EstimateInput)
) & { confirmKcalWarning?: boolean }

export type GoalSummary = PersonGoal

export type PlanReadiness = PersonListItem['planReadiness']

export type Rating = 1 | 2 | 3 | 4 | 5

export type AllergenCode = Allergy['allergenCode']

export type AnswerableAllergyStatus = Exclude<
  NonNullable<PersonDetail['allergyStatus']>,
  'HAS_ALLERGIES'
>

export type AllergyItem =
  | { allergenCode: Exclude<AllergenCode, 'OTHER'> }
  | { allergenCode: 'OTHER'; customLabel: string }
