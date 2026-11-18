import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  container: {
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
