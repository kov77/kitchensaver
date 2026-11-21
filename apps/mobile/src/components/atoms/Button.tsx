import { ActivityIndicator, Pressable, Text } from 'react-native'

import { colors } from '@/theme/colors'

import { styles } from './Button.styles'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = {
  title: string
  accessibilityLabel?: string
  onPress: () => void
  variant?: ButtonVariant
  isLoading?: boolean
}

const VARIANT_STYLES = {
  primary: {
    button: styles.primary,
    title: styles.primaryTitle,
    spinner: colors.textOnBrand,
  },
  secondary: {
    button: styles.secondary,
    title: styles.secondaryTitle,
    spinner: colors.brandPrimary,
  },
  danger: {
    button: styles.danger,
    title: styles.dangerTitle,
    spinner: colors.warning,
  },
} as const

export function Button({
  title,
  accessibilityLabel = title,
  onPress,
  variant = 'primary',
  isLoading = false,
}: ButtonProps) {
  const variantStyles = VARIANT_STYLES[variant]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variantStyles.button,
        (pressed || isLoading) && styles.inactive,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={variantStyles.spinner} />
      ) : (
        <Text style={[styles.title, variantStyles.title]}>{title}</Text>
      )}
    </Pressable>
  )
}
