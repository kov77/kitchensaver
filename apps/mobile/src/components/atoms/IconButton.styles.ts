import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'

import { INACTIVE_OPACITY } from './constants'

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: sizes.touchTargetMin,
    height: sizes.touchTargetMin,
    borderRadius: radius.control,
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
  },
  inactive: {
    opacity: INACTIVE_OPACITY,
  },
})
