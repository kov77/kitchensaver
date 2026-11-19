import { View } from 'react-native'

import type { PersonListItem } from '@/api/types'
import { Avatar } from '@/components/atoms/Avatar'
import { Text } from '@/components/atoms/Text'

import { styles } from './PersonCard.styles'
import { describeGoal, describeReadiness, getInitial } from './utils'

type PersonCardProps = {
  person: PersonListItem
}

export function PersonCard({
  person: { name, age, goal, planReadiness },
}: PersonCardProps) {
  const readinessHint = describeReadiness(planReadiness)

  return (
    <View accessible style={styles.card}>
      <Avatar initial={getInitial(name)} />
      <View style={styles.details}>
        <Text variant="button">{`${name} · ${age}`}</Text>
        <Text variant="subtitle" color="textMuted">
          {describeGoal(goal)}
        </Text>
        {readinessHint ? (
          <Text variant="link" color="warning">
            {readinessHint}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
