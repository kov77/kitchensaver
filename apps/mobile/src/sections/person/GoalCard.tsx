import { useTranslation } from 'react-i18next'
import type { PersonDetail } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { SectionCard } from '@/components/molecules/SectionCard'
import { usePersonSummary } from '@/core/usePersonSummary'

type GoalCardProps = {
  goal: PersonDetail['goal']
  onChangeGoal: () => void
}

export function GoalCard({ goal, onChangeGoal }: GoalCardProps) {
  const { t } = useTranslation('person')
  const { describeGoal } = usePersonSummary()
  return (
    <SectionCard title={t('goal-title')}>
      <Text variant="body">{describeGoal(goal)}</Text>
      <Button
        title={goal ? t('change-goal') : t('set-goal')}
        variant="secondary"
        onPress={onChangeGoal}
      />
    </SectionCard>
  )
}
