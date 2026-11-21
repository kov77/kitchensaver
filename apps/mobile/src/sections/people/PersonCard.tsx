import { Pressable, View } from 'react-native'

import type { PersonListItem } from '@/api/types'
import { Avatar } from '@/components/atoms/Avatar'
import { Text } from '@/components/atoms/Text'
import { describeGoal, describeReadiness } from '@/utils/person'

import { PEOPLE_TEXT } from './constants'
import { styles } from './PersonCard.styles'
import { getInitial } from './utils'

type PersonCardProps = {
  person: PersonListItem
  onPress: () => void
}

export function PersonCard({
  person: { name, age, goal, planReadiness },
  onPress,
}: PersonCardProps) {
  const readinessHint = describeReadiness(planReadiness)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        `${name}, ${age}.`,
        describeGoal(goal),
        readinessHint,
      ]
        .filter(Boolean)
        .join(' ')}
      accessibilityHint={PEOPLE_TEXT.cardHint}
      onPress={onPress}
      style={styles.card}
    >
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
    </Pressable>
  )
}
