import { View } from 'react-native'

import { Text } from './Text'
import { styles } from './Avatar.styles'

type AvatarProps = {
  initial: string
}

export function Avatar({ initial }: AvatarProps) {
  return (
    <View accessibilityElementsHidden style={styles.avatar}>
      <Text variant="button" color="brandPrimary">
        {initial}
      </Text>
    </View>
  )
}
