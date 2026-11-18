import { render, screen, userEvent } from '@testing-library/react-native'

import { ErrorFallback } from './ErrorFallback'

describe('ErrorFallback', () => {
  it('explains the problem without technical details', async () => {
    await render(<ErrorFallback onRetry={jest.fn()} />)

    expect(
      screen.getByRole('header', { name: 'Something went wrong' }),
    ).toBeTruthy()
    expect(screen.getByText(/unexpected problem/)).toBeTruthy()
  })

  it('lets the user try again', async () => {
    const onRetry = jest.fn()
    await render(<ErrorFallback onRetry={onRetry} />)

    await userEvent
      .setup()
      .press(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
