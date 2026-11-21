import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Text } from '@/components/atoms/Text'

import { styles } from './Toast.styles'

type ToastProps = {
  message: string
  variant: 'error' | 'info'
  onDismiss: () => void
}

export function Toast({ message, variant, onDismiss }: ToastProps) {
  const { t } = useTranslation('common')
  const isError = variant === 'error'

  return (
    <Pressable
      accessibilityRole="alert"
      accessibilityLabel={message}
      accessibilityHint={t('toast-dismiss')}
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
