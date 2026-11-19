import { StyleSheet } from 'react-native'

import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})
