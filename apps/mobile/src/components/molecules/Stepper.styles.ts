import { StyleSheet } from 'react-native'

import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: {
    minWidth: spacing.xl,
    textAlign: 'center',
  },
})
