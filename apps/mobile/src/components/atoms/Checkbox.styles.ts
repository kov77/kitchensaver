import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: sizes.touchTargetMin,
  },
  box: {
    width: sizes.checkbox,
    height: sizes.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: sizes.checkboxBorderWidth,
    borderColor: colors.textMuted,
    borderRadius: radius.checkbox,
    backgroundColor: colors.surface,
  },
  boxChecked: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimary,
  },
  label: {
    flex: 1,
  },
})
