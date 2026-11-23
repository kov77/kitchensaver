import { View } from 'react-native'

import { Chip } from '@/components/atoms/Chip'

import { styles } from './RatingChips.styles'

type RatingChipsProps<Value extends number> = {
  label: string
  getOptionLabel: (value: Value) => string
  values: readonly Value[]
  value: number
  onChange: (value: Value) => void
}

export function RatingChips<Value extends number>({
  label,
  getOptionLabel,
  values,
  value,
  onChange,
}: RatingChipsProps<Value>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={styles.group}
    >
      {values.map((option) => (
        <Chip
          key={option}
          label={String(option)}
          accessibilityLabel={getOptionLabel(option)}
          role="radio"
          isSelected={option === value}
          onPress={() => onChange(option)}
        />
      ))}
    </View>
  )
}
