import { act, render, screen, userEvent } from '@testing-library/react-native'

import { dismissToast, getToasts, showToast } from '@/core/toast/toastStore'

import { ToastHost } from './ToastHost'

afterEach(() => {
  getToasts().forEach(({ id }) => dismissToast(id))
})

describe('ToastHost', () => {
  it('shows nothing when there are no toasts', async () => {
    await render(<ToastHost />)

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows a toast as soon as it is created', async () => {
    await render(<ToastHost />)

    await act(async () =>
      showToast({ message: 'No connection', variant: 'error' }),
    )

    expect(screen.getByRole('alert', { name: 'No connection' })).toBeTruthy()
  })

  it('removes a toast when the user taps it', async () => {
    await render(<ToastHost />)
    await act(async () =>
      showToast({ message: 'No connection', variant: 'error' }),
    )

    await userEvent
      .setup()
      .press(screen.getByRole('alert', { name: 'No connection' }))

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows several toasts at once', async () => {
    await render(<ToastHost />)

    await act(async () => {
      showToast({ message: 'First' })
      showToast({ message: 'Second' })
    })

    expect(screen.getAllByRole('alert')).toHaveLength(2)
  })
})
