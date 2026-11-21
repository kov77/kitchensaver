import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Text } from '@/components/atoms/Text'

import { styles } from './SectionCard.styles'

type SectionCardProps = {
  title: string
  children: ReactNode
}

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      <Text variant="button" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  )
}
