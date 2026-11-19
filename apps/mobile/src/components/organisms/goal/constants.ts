import type {
  ActivityLevel,
  EstimatedGoalType,
  FormulaSex,
  GoalType,
} from '@/core/types'

export const GOAL_MODE = {
  MANUAL: 'MANUAL',
  ESTIMATED: 'ESTIMATED',
} as const

export const GOAL_EDITOR_TEXT = {
  modeLabel: 'How do you want to set the goal?',
  modeManual: 'I already know my daily calories',
  modeEstimate: 'Help me estimate',
  goalTypeLabel: 'What is the goal?',
  kcalLabel: 'Daily calories (kcal)',
  kcalPlaceholder: 'For example, 2000',
  bodyIntro:
    'Height, weight and activity are used to estimate the calories that keep your weight stable. They are used for this estimate only.',
  heightLabel: 'Height (cm)',
  weightLabel: 'Weight (kg)',
  activityLabel: 'Activity level',
  sexLabel: 'Sex used in the formula',
  calculate: 'Calculate estimate',
  estimateTitle: 'Your estimate',
  maintenanceSuffix: 'kcal/day to keep your weight',
  disclaimer:
    'This is an estimate for information only. It is not medical advice.',
  assumptionsLabel: 'How it was calculated',
  targetLabel: 'Your daily calorie goal (kcal)',
  targetHint:
    'The estimate is for keeping your weight. Enter the target you want.',
  changeDetails: 'Change details',
} as const

export const ASSUMPTION_TEXT: Record<string, string> = {
  AGE_IN_COMPLETED_YEARS:
    'Age is counted in completed years, from the date of birth.',
  MAINTENANCE_ENERGY_NOT_A_TARGET:
    'This is the energy to keep your weight, not a weight loss or weight gain target.',
  LARGE_INDIVIDUAL_VARIATION:
    'Individual needs vary a lot, so your real figure can differ noticeably.',
  INCLUDES_GROWTH_ALLOWANCE: 'An allowance for growth is included.',
}

export const UNKNOWN_ASSUMPTION_TEXT = 'Other assumptions of the method apply.'

export const GOAL_EDITOR_ERRORS = {
  kcal: 'Enter whole calories between 500 and 10,000.',
  height: 'Enter a height between 90 and 250 cm.',
  weight: 'Enter a weight between 20 and 400 kg.',
  choose: 'Choose an option.',
} as const

export const GOAL_TYPES: readonly GoalType[] = [
  'LOSE',
  'MAINTAIN',
  'GAIN',
  'CUSTOM',
]

export const ESTIMATED_GOAL_TYPES: readonly EstimatedGoalType[] = [
  'LOSE',
  'MAINTAIN',
  'GAIN',
]

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  INACTIVE: 'Inactive',
  LOW_ACTIVE: 'Low active',
  ACTIVE: 'Active',
  VERY_ACTIVE: 'Very active',
}

export const SEX_LABELS: Record<FormulaSex, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
}
