import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form'

import { DateField } from './DateField'

type DateFieldProps = Parameters<typeof DateField>[0]

type FormDateFieldProps<Values extends FieldValues> = Omit<
  DateFieldProps,
  'value' | 'onChange' | 'errorMessage'
> & {
  control: Control<Values>
  name: FieldPathByValue<Values, Date | null>
}

export function FormDateField<Values extends FieldValues>({
  control,
  name,
  ...dateFieldProps
}: FormDateFieldProps<Values>) {
  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({ control, name })

  return (
    <DateField
      {...dateFieldProps}
      value={value}
      onChange={onChange}
      errorMessage={error?.message}
    />
  )
}
