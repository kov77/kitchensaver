import { StyleSheet } from 'react-native'

import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
})
