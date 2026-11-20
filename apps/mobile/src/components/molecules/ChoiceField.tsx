import { View } from 'react-native'

import { Chip } from '@/components/atoms/Chip'
import { Text } from '@/components/atoms/Text'

import { styles } from './ChoiceField.styles'

type ChoiceFieldProps<Value extends string> = {
  label: string
  options: readonly { value: Value; label: string }[]
  value: Value | null
  onChange: (value: Value) => void
  errorMessage?: string
  labelColor?: 'text' | 'textMuted'
}

export function ChoiceField<Value extends string>({
  label,
  options,
  value,
  onChange,
  errorMessage,
  labelColor = 'textMuted',
}: ChoiceFieldProps<Value>) {
  return (
    <View style={styles.container}>
      <Text variant="label" color={labelColor} accessibilityRole="header">
        {label}
      </Text>
      <View style={styles.options}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            role="radio"
            isSelected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      {errorMessage ? (
        <Text variant="link" color="warning" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  )
}
