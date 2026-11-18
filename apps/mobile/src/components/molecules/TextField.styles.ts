import { StyleSheet } from 'react-native'

import { sizes } from '@/theme/sizes'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  toggle: {
    minHeight: sizes.touchTargetMin,
    justifyContent: 'center',
    paddingLeft: spacing.md,
  },
})
