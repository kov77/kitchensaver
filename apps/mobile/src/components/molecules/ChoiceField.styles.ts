import { StyleSheet } from 'react-native'

import { spacing } from '@/theme/spacing'

export const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})
