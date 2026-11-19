import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTargetMin,
    paddingHorizontal: spacing.lg,
    borderWidth: sizes.checkboxBorderWidth,
    borderColor: colors.surfaceMuted,
    borderRadius: radius.control,
    backgroundColor: colors.surfaceMuted,
  },
  selected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandSoft,
  },
})
