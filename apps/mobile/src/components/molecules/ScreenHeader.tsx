import { View } from 'react-native'

import { Text } from '@/components/atoms/Text'

import { styles } from './ScreenHeader.styles'

type ScreenHeaderProps = {
  title: string
  subtitle?: string
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="subtitle" color="textMuted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}
