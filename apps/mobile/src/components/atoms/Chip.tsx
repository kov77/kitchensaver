import { Pressable } from 'react-native'

import { Text } from './Text'
import { styles } from './Chip.styles'

type ChipProps = {
  label: string
  isSelected: boolean
  onPress: () => void
  role?: 'checkbox' | 'radio'
}

export function Chip({
  label,
  isSelected,
  onPress,
  role = 'checkbox',
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
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
