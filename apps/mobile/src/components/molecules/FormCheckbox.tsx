import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'
import { View } from 'react-native'

import { Checkbox } from '@/components/atoms/Checkbox'
import { Text } from '@/components/atoms/Text'

type FormCheckboxProps<Values extends FieldValues> = {
  control: Control<Values>
  name: FieldPathByValue<Values, boolean>
  label: string
}

export function FormCheckbox<Values extends FieldValues>({
  control,
  name,
  label,
}: FormCheckboxProps<Values>) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name })

  return (
    <View>
      <Checkbox label={label} isChecked={value} onChange={onChange} />
      {error ? (
        <Text variant="link" color="warning" accessibilityLiveRegion="polite">
          {error.message}
        </Text>
      ) : null}
    </View>
  )
}
