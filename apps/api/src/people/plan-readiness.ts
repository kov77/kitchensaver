import { isGoalTypeAllowedForAge, methodForAge } from '@kitchensaver/nutrition'

import type { NutritionGoal } from '../generated/prisma/client.js'

export type PlanReadinessReason =
  'MISSING_GOAL' | 'GOAL_REVIEW_REQUIRED' | 'GOAL_NOT_VALID_FOR_AGE'

export interface PlanReadiness {
  ready: boolean
  reasons: PlanReadinessReason[]
}

type GoalForReadiness = Pick<
  NutritionGoal,
  'goalType' | 'calculationMethod' | 'reviewRequiredAt'
>

export function planReadiness(
  ageYears: number,
  goal: GoalForReadiness | null,
): PlanReadiness {
  if (!goal) return { ready: false, reasons: ['MISSING_GOAL'] }

  const reasons: PlanReadinessReason[] = []
  if (goal.reviewRequiredAt) reasons.push('GOAL_REVIEW_REQUIRED')
  const methodNoLongerApplies =
    goal.calculationMethod !== null &&
    goal.calculationMethod !== methodForAge(ageYears)
  if (
    methodNoLongerApplies ||
    !isGoalTypeAllowedForAge(goal.goalType, ageYears)
  ) {
    reasons.push('GOAL_NOT_VALID_FOR_AGE')
  }
  return { ready: reasons.length === 0, reasons }
}
