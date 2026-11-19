import type { PersonListItem } from '@/api/types'

import { GOAL_TYPE_LABELS, PEOPLE_TEXT, READINESS_HINTS } from './constants'

export function getInitial(name: string) {
  const [firstCharacter = ''] = Array.from(name.trim())
  return firstCharacter.toLocaleUpperCase()
}

export function describeGoal(goal: PersonListItem['goal']) {
  if (!goal) return PEOPLE_TEXT.noGoal
  const kcal = `${goal.dailyKcal.toLocaleString('en-US')} ${PEOPLE_TEXT.kcalPerDay}`
  return `${GOAL_TYPE_LABELS[goal.goalType]} · ${kcal}`
}

export function describeReadiness({
  ready,
  reasons,
}: PersonListItem['planReadiness']) {
  if (ready) return null
  const hints = reasons.map((reason) => READINESS_HINTS[reason])
  return `${PEOPLE_TEXT.notReady}: ${hints.join(', ')}`
}
