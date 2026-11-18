import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  toast: {
    justifyContent: 'center',
    minHeight: sizes.touchTargetMin,
    padding: spacing.lg,
    borderRadius: radius.control,
  },
  error: {
    backgroundColor: colors.warningSoft,
  },
  info: {
    backgroundColor: colors.brandSoft,
  },
})
