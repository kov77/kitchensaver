import { render, screen, userEvent } from '@testing-library/react-native'

import { LoadFailure } from './LoadFailure'

function renderFailure(isRetrying = false) {
  const onRetry = jest.fn()
  return {
    onRetry,
    ready: render(
      <LoadFailure
        message="Could not load"
        retryLabel="Try again"
        isRetrying={isRetrying}
        onRetry={onRetry}
      />,
    ),
  }
}

describe('LoadFailure', () => {
  it('shows the message and retries when asked', async () => {
    const { onRetry, ready } = renderFailure()
    await ready

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('Could not load')).toBeTruthy()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not retry again while a retry is running', async () => {
    const { onRetry, ready } = renderFailure(true)
    await ready

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).not.toHaveBeenCalled()
  })
})
