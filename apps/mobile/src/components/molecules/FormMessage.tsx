import { View } from 'react-native'

import { Text } from '@/components/atoms/Text'

import { styles } from './FormMessage.styles'

type FormMessageProps = {
  message: string
  tone?: 'error' | 'info'
}

export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  const isError = tone === 'error'

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, isError ? styles.error : styles.info]}
    >
      <Text variant="body" color={isError ? 'warning' : 'brandPrimary'}>
        {message}
      </Text>
    </View>
  )
}
