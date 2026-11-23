import { StyleSheet } from 'react-native'

import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
})
