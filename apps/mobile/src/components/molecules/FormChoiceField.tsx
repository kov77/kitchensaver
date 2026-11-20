import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'

import { ChoiceField } from './ChoiceField'

type FormChoiceFieldProps<Values extends FieldValues, Value extends string> = {
  control: Control<Values>
  name: FieldPathByValue<Values, Value | null>
  label: string
  options: readonly { value: Value; label: string }[]
  labelColor?: 'text' | 'textMuted'
}

export function FormChoiceField<
  Values extends FieldValues,
  Value extends string,
>({
  control,
  name,
  label,
  options,
  labelColor,
}: FormChoiceFieldProps<Values, Value>) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name })

  return (
    <ChoiceField
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      errorMessage={error?.message}
      labelColor={labelColor}
    />
  )
}
