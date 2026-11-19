import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { sizes } from '@/theme/sizes'

export const styles = StyleSheet.create({
  avatar: {
    width: sizes.avatar,
    height: sizes.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.avatar,
    backgroundColor: colors.brandSoft,
  },
})
