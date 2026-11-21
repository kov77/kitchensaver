import {
  GOAL_TYPE_LABELS,
  PERSON_SUMMARY_TEXT,
  READINESS_HINTS,
} from '@/core/constants'
import type { GoalSummary, PlanReadiness } from '@/core/types'

export function describeGoal(goal: GoalSummary | null) {
  if (!goal) return PERSON_SUMMARY_TEXT.noGoal
  const kcal = `${goal.dailyKcal.toLocaleString('en-US')} ${PERSON_SUMMARY_TEXT.kcalPerDay}`
  return `${GOAL_TYPE_LABELS[goal.goalType]} · ${kcal}`
}

export function describeReadiness({ ready, reasons }: PlanReadiness) {
  if (ready) return null
  const hints = reasons.map((reason) => READINESS_HINTS[reason])
  return `${PERSON_SUMMARY_TEXT.notReady}: ${hints.join(', ')}`
}
