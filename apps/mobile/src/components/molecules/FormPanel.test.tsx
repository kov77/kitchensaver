import { render, screen, userEvent } from '@testing-library/react-native'
import { Text } from 'react-native'

import { FormPanel } from './FormPanel'

function renderPanel(isOpen: boolean) {
  const onOpen = jest.fn()
  const onCancel = jest.fn()
  return {
    onOpen,
    onCancel,
    ready: render(
      <FormPanel
        isOpen={isOpen}
        openLabel="Add food"
        cancelLabel="Cancel"
        onOpen={onOpen}
        onCancel={onCancel}
      >
        <Text>The form</Text>
      </FormPanel>,
    ),
  }
}

describe('FormPanel', () => {
  it('offers to open while closed and hides the form', async () => {
    const { onOpen, ready } = renderPanel(false)
    await ready

    expect(screen.queryByText('The form')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Add food' }))

    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('shows the form and a way to cancel while open', async () => {
    const { onCancel, ready } = renderPanel(true)
    await ready

    expect(screen.getByText('The form')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Add food' })).toBeNull()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
