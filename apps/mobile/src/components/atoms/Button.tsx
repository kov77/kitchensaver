import { ActivityIndicator, Pressable, Text } from 'react-native'

import { colors } from '@/theme/colors'

import { styles } from './Button.styles'

type ButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  isLoading?: boolean
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
}: ButtonProps) {
  const isPrimary = variant === 'primary'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        (pressed || isLoading) && styles.inactive,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          color={isPrimary ? colors.textOnBrand : colors.brandPrimary}
        />
      ) : (
        <Text
          style={[
            styles.title,
            isPrimary ? styles.primaryTitle : styles.secondaryTitle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}
