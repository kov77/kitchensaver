import { Pressable, View } from 'react-native'

import { ICON_SYMBOLS } from './constants'
import { Text } from './Text'
import { styles } from './TagChip.styles'

type TagChipProps = {
  label: string
  removeLabel: string
  onRemove: () => void
  isDisabled?: boolean
}

export function TagChip({
  label,
  removeLabel,
  onRemove,
  isDisabled = false,
}: TagChipProps) {
  return (
    <View style={styles.chip}>
      <Text variant="input">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onRemove}
        style={({ pressed }) => [
          styles.remove,
          (pressed || isDisabled) && styles.inactive,
        ]}
      >
        <Text variant="button" color="danger">
          {ICON_SYMBOLS.remove}
        </Text>
      </Pressable>
    </View>
  )
}
