import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.touchTargetMin,
    padding: spacing.lg,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
})
