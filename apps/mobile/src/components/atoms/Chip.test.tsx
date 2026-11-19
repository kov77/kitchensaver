import { render, screen, userEvent } from '@testing-library/react-native'

import { Chip } from './Chip'

describe('Chip', () => {
  it('reports a press', async () => {
    const onPress = jest.fn()
    await render(<Chip label="Milk" isSelected={false} onPress={onPress} />)

    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: 'Milk' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('exposes whether it is selected', async () => {
    await render(<Chip label="Milk" isSelected onPress={jest.fn()} />)

    expect(screen.getByRole('checkbox', { name: 'Milk' })).toBeChecked()
  })

  it('can act as one option of a single-choice group', async () => {
    await render(
      <Chip label="Yes" isSelected={false} role="radio" onPress={jest.fn()} />,
    )

    expect(screen.getByRole('radio', { name: 'Yes' })).not.toBeChecked()
  })
})
