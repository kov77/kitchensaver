import { zodResolver } from '@hookform/resolvers/zod'
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native'
import { useForm } from 'react-hook-form'
import * as zod from 'zod'

import { SUBMIT_LABEL, SubmitButton } from '@/test-utils/SubmitButton'
import { formatDisplayDate } from '@/utils/dates'

import { FormDateField } from './FormDateField'

jest.mock('@react-native-community/datetimepicker', () => {
  const { View: MockView } = jest.requireActual('react-native')
  return {
    __esModule: true,
    default: (props: object) => <MockView testID="date-picker" {...props} />,
  }
})

const schema = zod.object({
  birth: zod
    .custom<Date | null>()
    .refine((value) => value !== null, 'Select the date.'),
})

type Values = zod.input<typeof schema>

const onSubmit = jest.fn()

function Harness() {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { birth: null },
  })

  return (
    <>
      <FormDateField
        control={control}
        name="birth"
        label="Date of birth"
        placeholder="Select date"
        minimumDate={new Date(1900, 0, 1)}
        maximumDate={new Date(2010, 0, 1)}
      />
      <SubmitButton
        onPress={() => void handleSubmit((values) => onSubmit(values))()}
      />
    </>
  )
}

function submit() {
  return userEvent
    .setup()
    .press(screen.getByRole('button', { name: SUBMIT_LABEL }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('FormDateField', () => {
  it('stores the picked date and shows it', async () => {
    await render(<Harness />)
    const picked = new Date(1990, 4, 15)

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: /Date of birth/ }))
    fireEvent(
      screen.getByTestId('date-picker'),
      'onChange',
      { type: 'set' },
      picked,
    )
    await submit()

    expect(screen.getByText(formatDisplayDate(picked))).toBeTruthy()
    expect(onSubmit).toHaveBeenCalledWith({ birth: picked })
  })

  it('shows its message when no date was chosen', async () => {
    await render(<Harness />)

    await submit()

    expect(await screen.findByText('Select the date.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
