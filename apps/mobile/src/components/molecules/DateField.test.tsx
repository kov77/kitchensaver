import {
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native'

import { DateField } from './DateField'

jest.mock('@react-native-community/datetimepicker', () => {
  const { View: MockView } = jest.requireActual('react-native')
  return {
    __esModule: true,
    default: (props: object) => <MockView testID="date-picker" {...props} />,
  }
})

const MINIMUM = new Date(1900, 0, 1)
const MAXIMUM = new Date(2013, 10, 18)

async function renderField(value: Date | null = null) {
  const onChange = jest.fn()
  await render(
    <DateField
      label="Date of birth"
      placeholder="Select date"
      value={value}
      onChange={onChange}
      minimumDate={MINIMUM}
      maximumDate={MAXIMUM}
    />,
  )
  return onChange
}

async function openPicker() {
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: /Date of birth/ }))
}

describe('DateField', () => {
  it('shows the placeholder until a date is chosen', async () => {
    await renderField()

    expect(screen.getByText('Select date')).toBeTruthy()
    expect(screen.queryByTestId('date-picker')).toBeNull()
  })

  it('shows the chosen date with a word for the month', async () => {
    await renderField(new Date(2010, 2, 4))

    expect(screen.getByText('4 March 2010')).toBeTruthy()
  })

  it('opens the picker limited to the allowed range', async () => {
    await renderField()

    await openPicker()

    const picker = screen.getByTestId('date-picker')
    expect(picker.props.minimumDate).toBe(MINIMUM)
    expect(picker.props.maximumDate).toBe(MAXIMUM)
  })

  it('reports the date the user picked', async () => {
    const onChange = await renderField()
    await openPicker()
    const picked = new Date(2005, 5, 15)

    fireEvent(
      screen.getByTestId('date-picker'),
      'onChange',
      { type: 'set' },
      picked,
    )

    expect(onChange).toHaveBeenCalledWith(picked)
  })

  it('ignores a dismissed picker', async () => {
    const onChange = await renderField()
    await openPicker()

    fireEvent(
      screen.getByTestId('date-picker'),
      'onChange',
      { type: 'dismissed' },
      undefined,
    )

    expect(onChange).not.toHaveBeenCalled()
  })
})
