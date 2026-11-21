import type { PersonDetail } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { SectionCard } from '@/components/molecules/SectionCard'
import { describeGoal } from '@/utils/person'

import { PERSON_TEXT } from './constants'

type GoalCardProps = {
  goal: PersonDetail['goal']
  onChangeGoal: () => void
}

export function GoalCard({ goal, onChangeGoal }: GoalCardProps) {
  return (
    <SectionCard title={PERSON_TEXT.goalTitle}>
      <Text variant="body">{describeGoal(goal)}</Text>
      <Button
        title={goal ? PERSON_TEXT.changeGoal : PERSON_TEXT.setGoal}
        variant="secondary"
        onPress={onChangeGoal}
      />
    </SectionCard>
  )
}
