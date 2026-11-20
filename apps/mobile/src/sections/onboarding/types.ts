import type { GoalDraft } from '@/core/types'

export type Profile = { name: string; dateOfBirth: Date }

export type FlowState =
  | { step: 'profile'; profile: Profile | null }
  | { step: 'goal'; profile: Profile }
  | { step: 'allergies'; profile: Profile; goal: GoalDraft | null }

export type FlowAction =
  | { type: 'profileSubmitted'; profile: Profile }
  | { type: 'goalChosen'; goal: GoalDraft | null }
  | { type: 'back' }
