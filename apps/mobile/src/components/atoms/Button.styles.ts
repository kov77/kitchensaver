import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'
import { spacing } from '@/theme/spacing'
import { typography } from '@/theme/typography'

import { INACTIVE_OPACITY } from './constants'

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.buttonMinHeight,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.control,
  },
  primary: {
    backgroundColor: colors.brandPrimary,
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  inactive: {
    opacity: INACTIVE_OPACITY,
  },
  title: {
    ...typography.button,
  },
  primaryTitle: {
    color: colors.textOnBrand,
  },
  secondaryTitle: {
    color: colors.brandPrimary,
  },
  dangerTitle: {
    color: colors.textOnBrand,
  },
})
