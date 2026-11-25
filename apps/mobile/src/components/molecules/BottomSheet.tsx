import type { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native'

import { IconButton } from '@/components/atoms/IconButton'
import { Text } from '@/components/atoms/Text'

import { styles } from './BottomSheet.styles'

type BottomSheetProps = {
  title: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({
  title,
  closeLabel,
  onClose,
  children,
}: BottomSheetProps) {
  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <View accessibilityViewIsModal style={styles.overlay}>
        <Pressable
          accessible={false}
          style={styles.backdrop}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text
                variant="title"
                accessibilityRole="header"
                style={styles.title}
              >
                {title}
              </Text>
              <IconButton
                icon="close"
                accessibilityLabel={closeLabel}
                onPress={onClose}
              />
            </View>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}
