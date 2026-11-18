import { Pressable } from 'react-native'

import { Text } from '@/components/atoms/Text'

import { TOAST_DISMISS_LABEL } from './constants'
import { styles } from './Toast.styles'

type ToastProps = {
  message: string
  variant: 'error' | 'info'
  onDismiss: () => void
}

export function Toast({ message, variant, onDismiss }: ToastProps) {
  const isError = variant === 'error'

  return (
    <Pressable
      accessibilityRole="alert"
      accessibilityLabel={message}
      accessibilityHint={TOAST_DISMISS_LABEL}
      accessibilityLiveRegion="polite"
      onPress={onDismiss}
      style={[styles.toast, isError ? styles.error : styles.info]}
    >
      <Text variant="body" color={isError ? 'warning' : 'brandPrimary'}>
        {message}
      </Text>
    </Pressable>
  )
}
