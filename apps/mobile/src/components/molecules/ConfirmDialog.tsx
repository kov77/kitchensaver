import { Modal, View } from 'react-native'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'

import { styles } from './ConfirmDialog.styles'

type ConfirmDialogProps = {
  isVisible: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isVisible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <View accessibilityViewIsModal style={styles.overlay}>
        <View style={styles.dialog}>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="body">{message}</Text>
          <Button title={confirmLabel} onPress={onConfirm} />
          <Button title={cancelLabel} variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  )
}
