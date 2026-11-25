import { render, screen, userEvent } from '@testing-library/react-native'

import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('is a button named by its label, not by its symbol', async () => {
    await render(
      <IconButton
        icon="remove"
        accessibilityLabel="Remove Kiwi"
        onPress={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Remove Kiwi' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '✕' })).toBeNull()
    expect(screen.getByText('✕')).toBeTruthy()
  })

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn()
    await render(
      <IconButton
        icon="remove"
        accessibilityLabel="Remove"
        onPress={onPress}
      />,
    )

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Remove' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('calls onPress for the danger variant', async () => {
    const onPress = jest.fn()
    await render(
      <IconButton
        icon="remove"
        accessibilityLabel="Remove"
        variant="danger"
        onPress={onPress}
      />,
    )

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Remove' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('ignores presses and reports disabled when disabled', async () => {
    const onPress = jest.fn()
    await render(
      <IconButton
        icon="remove"
        accessibilityLabel="Remove"
        isDisabled
        onPress={onPress}
      />,
    )
    const button = screen.getByRole('button', { name: 'Remove' })

    await userEvent.setup().press(button)

    expect(onPress).not.toHaveBeenCalled()
    expect(button.props.accessibilityState).toMatchObject({ disabled: true })
  })
})
