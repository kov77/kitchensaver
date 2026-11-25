import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'
import { View } from 'react-native'

import { Text } from '@/components/atoms/Text'

import { styles } from './FormStepperField.styles'
import { Stepper } from './Stepper'

type FormStepperFieldProps<Values extends FieldValues> = {
  control: Control<Values>
  name: FieldPathByValue<Values, number>
  label: string
  min: number
  max: number
  decreaseLabel: string
  increaseLabel: string
}

export function FormStepperField<Values extends FieldValues>({
  control,
  name,
  label,
  min,
  max,
  decreaseLabel,
  increaseLabel,
}: FormStepperFieldProps<Values>) {
  const {
    field: { value, onChange },
  } = useController({ control, name })

  return (
    <View style={styles.container}>
      <Text variant="label" color="textMuted" accessibilityRole="header">
        {label}
      </Text>
      <Stepper
        value={value}
        min={min}
        max={max}
        label={label}
        decreaseLabel={decreaseLabel}
        increaseLabel={increaseLabel}
        onChange={onChange}
      />
    </View>
  )
}
