import { render, screen, userEvent } from '@testing-library/react-native'
import { Text } from 'react-native'

import { BottomSheet } from './BottomSheet'

function renderSheet() {
  const onClose = jest.fn()
  return {
    onClose,
    ready: render(
      <BottomSheet title="Add food" closeLabel="Close" onClose={onClose}>
        <Text>The form</Text>
      </BottomSheet>,
    ),
  }
}

describe('BottomSheet', () => {
  it('shows a title and its content', async () => {
    await renderSheet().ready

    expect(screen.getByRole('header', { name: 'Add food' })).toBeTruthy()
    expect(screen.getByText('The form')).toBeTruthy()
  })

  it('closes from the close button', async () => {
    const { onClose, ready } = renderSheet()
    await ready

    await userEvent.setup().press(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close by itself', async () => {
    const { onClose, ready } = renderSheet()
    await ready

    await userEvent.setup().press(screen.getByText('The form'))

    expect(onClose).not.toHaveBeenCalled()
  })
})
