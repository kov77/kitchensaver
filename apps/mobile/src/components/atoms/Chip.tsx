import { Pressable } from 'react-native'

import { Text } from './Text'
import { styles } from './Chip.styles'

type ChipProps = {
  label: string
  accessibilityLabel?: string
  isSelected: boolean
  onPress: () => void
  role?: 'checkbox' | 'radio'
}

export function Chip({
  label,
  accessibilityLabel = label,
  isSelected,
  onPress,
  role = 'checkbox',
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={[styles.chip, isSelected && styles.selected]}
    >
      <Text variant="input" color={isSelected ? 'brandPrimary' : 'text'}>
        {label}
      </Text>
    </Pressable>
  )
}
