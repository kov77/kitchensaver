import type { ReactNode } from 'react'
import { TextInput, View, type TextInputProps } from 'react-native'

import { colors } from '@/theme/colors'

import { styles } from './Input.styles'

type InputProps = TextInputProps & {
  accessory?: ReactNode
  isInvalid?: boolean
}

export function Input({
  accessory,
  isInvalid = false,
  ...inputProps
}: InputProps) {
  return (
    <View style={[styles.row, isInvalid && styles.invalid]}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...inputProps}
      />
      {accessory}
    </View>
  )
}
