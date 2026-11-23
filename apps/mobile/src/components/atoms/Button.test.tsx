import { render, screen, userEvent } from '@testing-library/react-native'

import { Button } from './Button'

describe('Button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn()
    await render(<Button title="Save" onPress={onPress} />)

    await userEvent.setup().press(screen.getByRole('button', { name: 'Save' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('ignores presses and reports busy while loading', async () => {
    const onPress = jest.fn()
    await render(<Button title="Save" isLoading onPress={onPress} />)
    const button = screen.getByRole('button', { name: 'Save' })

    await userEvent.setup().press(button)

    expect(onPress).not.toHaveBeenCalled()
    expect(button.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    })
  })

  it('hides the title while loading', async () => {
    await render(<Button title="Save" isLoading onPress={jest.fn()} />)

    expect(screen.queryByText('Save')).toBeNull()
  })

  it('renders the secondary variant', async () => {
    await render(
      <Button title="Log out" variant="secondary" onPress={jest.fn()} />,
    )

    expect(screen.getByText('Log out')).toBeTruthy()
  })

  it('can be named differently from its visible title', async () => {
    await render(
      <Button
        title="Remove"
        accessibilityLabel="Remove Peanuts"
        onPress={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Remove Peanuts' })).toBeTruthy()
  })

  it('calls onPress for the danger variant', async () => {
    const onPress = jest.fn()
    await render(<Button title="Delete" variant="danger" onPress={onPress} />)

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Delete' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
