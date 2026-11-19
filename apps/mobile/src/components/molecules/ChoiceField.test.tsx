import { render, screen, userEvent } from '@testing-library/react-native'

import { ChoiceField } from './ChoiceField'

const OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
] as const

describe('ChoiceField', () => {
  it('marks the chosen option', async () => {
    await render(
      <ChoiceField
        label="Sex"
        options={OPTIONS}
        value="FEMALE"
        onChange={jest.fn()}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Male' })).not.toBeChecked()
  })

  it('reports the value of the pressed option', async () => {
    const onChange = jest.fn()
    await render(
      <ChoiceField
        label="Sex"
        options={OPTIONS}
        value={null}
        onChange={onChange}
      />,
    )

    await userEvent.setup().press(screen.getByRole('radio', { name: 'Male' }))

    expect(onChange).toHaveBeenCalledWith('MALE')
  })

  it('shows an error under the options', async () => {
    await render(
      <ChoiceField
        label="Sex"
        options={OPTIONS}
        value={null}
        onChange={jest.fn()}
        errorMessage="Choose an option."
      />,
    )

    expect(screen.getByText('Choose an option.')).toBeTruthy()
  })
})
