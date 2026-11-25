import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'
import { spacing } from '@/theme/spacing'

import { INACTIVE_OPACITY } from './constants'

export const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touchTargetMin,
    paddingLeft: spacing.lg,
    borderRadius: radius.control,
    backgroundColor: colors.surfaceMuted,
  },
  remove: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: sizes.touchTargetMin,
    minHeight: sizes.touchTargetMin,
  },
  inactive: {
    opacity: INACTIVE_OPACITY,
  },
})
