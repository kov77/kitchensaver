import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'
import { spacing } from '@/theme/spacing'
import { typography } from '@/theme/typography'

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.inputMinHeight,
    paddingHorizontal: spacing.lg,
    borderWidth: sizes.inputBorderWidth,
    borderColor: colors.border,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
  },
  invalid: {
    borderColor: colors.danger,
  },
  input: {
    ...typography.input,
    flex: 1,
    color: colors.text,
  },
})
