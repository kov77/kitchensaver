import { render, screen, userEvent } from '@testing-library/react-native'

import { AccountUnavailable } from './AccountUnavailable'

async function renderUnavailable(overrides = {}) {
  const props = {
    message: 'No connection.',
    isRetrying: false,
    onRetry: jest.fn(),
    onLogOut: jest.fn(),
    ...overrides,
  }
  await render(<AccountUnavailable {...props} />)
  return { props }
}

describe('AccountUnavailable', () => {
  it('shows why the account could not be loaded', async () => {
    await renderUnavailable()

    expect(screen.getByText('No connection.')).toBeTruthy()
  })

  it('lets the user try again', async () => {
    const { props } = await renderUnavailable()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(props.onRetry).toHaveBeenCalledTimes(1)
  })

  it('lets the user leave instead of being stuck', async () => {
    const { props } = await renderUnavailable()

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Log out' }))

    expect(props.onLogOut).toHaveBeenCalledTimes(1)
  })

  it('shows that a retry is running and ignores more presses', async () => {
    const { props } = await renderUnavailable({ isRetrying: true })

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(props.onRetry).not.toHaveBeenCalled()
  })
})
