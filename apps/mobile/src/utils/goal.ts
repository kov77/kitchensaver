import type { GoalDraft } from '@/core/types'

export function toSaveGoalBody(draft: GoalDraft) {
  const confirmation = draft.confirmKcalWarning
    ? { confirmKcalWarning: true }
    : {}
  if (draft.mode === 'MANUAL') {
    const { goalType, dailyKcal } = draft
    return { mode: 'MANUAL' as const, goalType, dailyKcal, ...confirmation }
  }
  const { goalType, dailyKcal, heightCm, weightKg, activityLevel, formulaSex } =
    draft
  return {
    mode: 'ESTIMATED' as const,
    goalType,
    dailyKcal,
    heightCm,
    weightKg,
    activityLevel,
    formulaSex,
    ...confirmation,
  }
}
