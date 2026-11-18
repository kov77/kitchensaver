import { useSyncExternalStore } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Toast } from '@/components/molecules/Toast'
import {
  dismissToast,
  getToasts,
  subscribeToToasts,
} from '@/core/toast/toastStore'

import { styles } from './ToastHost.styles'

export function ToastHost() {
  const toasts = useSyncExternalStore(subscribeToToasts, getToasts)

  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.host}>
      {toasts.map(({ id, message, variant }) => (
        <Toast
          key={id}
          message={message}
          variant={variant}
          onDismiss={() => dismissToast(id)}
        />
      ))}
    </SafeAreaView>
  )
}
