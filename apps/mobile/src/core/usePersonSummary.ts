import { useTranslation } from 'react-i18next'

import { GOAL_TYPE_LABEL_KEYS, READINESS_HINT_KEYS } from '@/core/constants'
import type { GoalSummary, PlanReadiness } from '@/core/types'

export function usePersonSummary() {
  const { t } = useTranslation(['common'])

  const describeGoal = (goal: GoalSummary | null) => {
    if (!goal) return t('person-summary-no-goal')
    const kcal = `${goal.dailyKcal.toLocaleString('en-US')} ${t('person-summary-kcal-per-day')}`
    return `${t(GOAL_TYPE_LABEL_KEYS[goal.goalType])} · ${kcal}`
  }

  const describeReadiness = ({ ready, reasons }: PlanReadiness) => {
    if (ready) return null
    const hints = reasons.map((reason) => t(READINESS_HINT_KEYS[reason]))
    return `${t('person-summary-not-ready')}: ${hints.join(', ')}`
  }

  return { describeGoal, describeReadiness }
}
