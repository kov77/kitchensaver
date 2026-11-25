import type { ReactNode } from 'react'
import { Modal, View } from 'react-native'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'

import { styles } from './ConfirmDialog.styles'

type ConfirmDialogProps = {
  title: ReactNode
  message: ReactNode
  confirmLabel: string
  cancelLabel: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal animationType="fade" transparent visible onRequestClose={onCancel}>
      <View accessibilityViewIsModal style={styles.overlay}>
        <View style={styles.dialog}>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="body">{message}</Text>
          <Button
            title={confirmLabel}
            variant={confirmVariant}
            onPress={onConfirm}
          />
          <Button title={cancelLabel} variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  )
}
