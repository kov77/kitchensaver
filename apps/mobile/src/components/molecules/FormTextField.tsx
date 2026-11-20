import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'

import { TextField } from './TextField'

type TextFieldProps = Parameters<typeof TextField>[0]

type FormTextFieldProps<Values extends FieldValues> = Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'errorMessage'
> & {
  control: Control<Values>
  name: FieldPathByValue<Values, string>
}

export function FormTextField<Values extends FieldValues>({
  control,
  name,
  ...textFieldProps
}: FormTextFieldProps<Values>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController({ control, name })

  return (
    <TextField
      {...textFieldProps}
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      errorMessage={error?.message}
    />
  )
}
