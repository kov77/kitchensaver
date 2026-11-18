import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    padding: spacing.xxl,
  },
})
