import { isGoalTypeAllowedForAge, methodForAge } from '@kitchensaver/nutrition'

import type {
  AllergyStatus,
  NutritionGoal,
} from '../generated/prisma/client.js'

export type PlanReadinessReason =
  | 'MISSING_GOAL'
  | 'GOAL_REVIEW_REQUIRED'
  | 'GOAL_NOT_VALID_FOR_AGE'
  | 'ALLERGY_STATUS_MISSING'

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
  allergyStatus: AllergyStatus | null,
): PlanReadiness {
  const reasons: PlanReadinessReason[] = []
  if (!goal) {
    reasons.push('MISSING_GOAL')
  } else {
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
  }
  if (allergyStatus === null) reasons.push('ALLERGY_STATUS_MISSING')
  return { ready: reasons.length === 0, reasons }
}
