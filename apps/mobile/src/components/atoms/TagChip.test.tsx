import { render, screen, userEvent } from '@testing-library/react-native'

import { TagChip } from './TagChip'

function renderChip(isDisabled = false) {
  const onRemove = jest.fn()
  return {
    onRemove,
    ready: render(
      <TagChip
        label="Mushrooms"
        removeLabel="Remove Mushrooms"
        isDisabled={isDisabled}
        onRemove={onRemove}
      />,
    ),
  }
}

describe('TagChip', () => {
  it('shows its label and a remove button named after it', async () => {
    await renderChip().ready

    expect(screen.getByText('Mushrooms')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Remove Mushrooms' }),
    ).toBeTruthy()
  })

  it('removes only from the cross, not from the label', async () => {
    const { onRemove, ready } = renderChip()
    await ready
    const user = userEvent.setup()

    await user.press(screen.getByText('Mushrooms'))
    expect(onRemove).not.toHaveBeenCalled()

    await user.press(screen.getByRole('button', { name: 'Remove Mushrooms' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('ignores presses and reports disabled when disabled', async () => {
    const { onRemove, ready } = renderChip(true)
    await ready
    const button = screen.getByRole('button', { name: 'Remove Mushrooms' })

    await userEvent.setup().press(button)

    expect(onRemove).not.toHaveBeenCalled()
    expect(button.props.accessibilityState).toMatchObject({ disabled: true })
  })
})
