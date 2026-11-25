import { Pressable } from 'react-native'

import { ICON_SYMBOLS } from './constants'
import { styles } from './IconButton.styles'
import { Text } from './Text'

type IconButtonVariant = 'neutral' | 'danger'

type IconButtonProps = {
  icon: keyof typeof ICON_SYMBOLS
  accessibilityLabel: string
  onPress: () => void
  variant?: IconButtonVariant
  isDisabled?: boolean
}

const SYMBOL_COLORS = {
  neutral: 'brandPrimary',
  danger: 'danger',
} as const

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'neutral',
  isDisabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        (pressed || isDisabled) && styles.inactive,
      ]}
    >
      <Text variant="button" color={SYMBOL_COLORS[variant]}>
        {ICON_SYMBOLS[icon]}
      </Text>
    </Pressable>
  )
}
