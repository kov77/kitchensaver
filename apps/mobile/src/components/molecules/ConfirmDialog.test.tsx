import { render, screen, userEvent } from '@testing-library/react-native'

import { ConfirmDialog } from './ConfirmDialog'

function renderDialog() {
  const onConfirm = jest.fn()
  const onCancel = jest.fn()
  return {
    onConfirm,
    onCancel,
    ready: render(
      <ConfirmDialog
        title="Are you sure?"
        message="Details"
        confirmLabel="Continue"
        cancelLabel="Go back"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    ),
  }
}

describe('ConfirmDialog', () => {
  it('shows the title and the message', async () => {
    await renderDialog().ready

    expect(screen.getByText('Are you sure?')).toBeTruthy()
    expect(screen.getByText('Details')).toBeTruthy()
  })

  it('confirms only when the confirm button is pressed', async () => {
    const { onConfirm, onCancel, ready } = renderDialog()
    await ready

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Continue' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('lets the user go back without confirming', async () => {
    const { onConfirm, onCancel, ready } = renderDialog()
    await ready

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Go back' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
