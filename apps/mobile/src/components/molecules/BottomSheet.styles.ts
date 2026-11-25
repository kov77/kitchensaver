import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    gap: spacing.lg,
    padding: spacing.xxl,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
  },
})
