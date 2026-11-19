import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.overlay,
  },
  dialog: {
    gap: spacing.lg,
    padding: spacing.xxl,
    borderRadius: radius.dialog,
    backgroundColor: colors.background,
  },
})
