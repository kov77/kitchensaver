import { useState } from 'react'
import { Pressable, View, type TextInputProps } from 'react-native'

import { Input } from '@/components/atoms/Input'
import { Text } from '@/components/atoms/Text'
import { spacing } from '@/theme/spacing'

import { PASSWORD_TOGGLE_LABELS, PASSWORD_TOGGLE_TEXT } from './constants'
import { styles } from './TextField.styles'

type TextFieldProps = TextInputProps & {
  label: string
  errorMessage?: string
  isPassword?: boolean
}

export function TextField({
  label,
  errorMessage,
  isPassword = false,
  ...inputProps
}: TextFieldProps) {
  const [isHidden, setIsHidden] = useState(true)
  const toggleKey = isHidden ? 'show' : 'hide'

  return (
    <View style={styles.container}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Input
        accessibilityLabel={label}
        secureTextEntry={isPassword && isHidden}
        accessory={
          isPassword ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={PASSWORD_TOGGLE_LABELS[toggleKey]}
              hitSlop={spacing.sm}
              onPress={() => setIsHidden((previous) => !previous)}
              style={styles.toggle}
            >
              <Text variant="label" color="brandPrimary">
                {PASSWORD_TOGGLE_TEXT[toggleKey]}
              </Text>
            </Pressable>
          ) : null
        }
        {...inputProps}
      />
      {errorMessage ? (
        <Text variant="link" color="warning" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  )
}
