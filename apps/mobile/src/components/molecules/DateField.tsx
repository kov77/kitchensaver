import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'

import { styles as inputStyles } from '@/components/atoms/Input.styles'
import { Text } from '@/components/atoms/Text'
import { formatDisplayDate } from '@/utils/dates'

import { styles } from './DateField.styles'

type DateFieldProps = {
  label: string
  placeholder: string
  value: Date | null
  onChange: (date: Date) => void
  minimumDate: Date
  maximumDate: Date
  errorMessage?: string
}

export function DateField({
  label,
  placeholder,
  value,
  onChange,
  minimumDate,
  maximumDate,
  errorMessage,
}: DateFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const displayValue = value ? formatDisplayDate(value) : placeholder

  const handleChange = ({ type }: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setIsPickerOpen(false)
    if (type === 'set' && date) onChange(date)
  }

  return (
    <View style={styles.container}>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue}`}
        onPress={() => setIsPickerOpen((isOpen) => !isOpen)}
        style={inputStyles.row}
      >
        <Text variant="input" color={value ? 'text' : 'textMuted'}>
          {displayValue}
        </Text>
      </Pressable>
      {isPickerOpen ? (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          value={value ?? maximumDate}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}
      {errorMessage ? (
        <Text variant="link" color="warning" accessibilityLiveRegion="polite">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  )
}
