import { render, screen, userEvent } from '@testing-library/react-native'

import { SignInScreen } from './SignInScreen'

const mockSignIn = jest.fn()

jest.mock('@/core/auth/SessionProvider', () => ({
  useSession: () => ({ signIn: mockSignIn }),
}))

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.press(screen.getByRole('button', { name: 'Log in' }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SignInScreen', () => {
  it('asks for a valid email and a password before calling the server', async () => {
    await render(<SignInScreen />)

    await fillAndSubmit('not-an-email', '')

    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy()
    expect(screen.getByText('This field is required.')).toBeTruthy()
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('sends the trimmed email and the password as typed', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    await render(<SignInScreen />)

    await fillAndSubmit('  cook@example.com  ', ' pass word ')

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'cook@example.com',
      password: ' pass word ',
    })
  })

  it('shows a plain message when the credentials are wrong', async () => {
    mockSignIn.mockResolvedValue({ ok: false, failure: 'INVALID_CREDENTIALS' })
    await render(<SignInScreen />)

    await fillAndSubmit('cook@example.com', 'wrong-password')

    expect(
      await screen.findByText('Email or password is incorrect.'),
    ).toBeTruthy()
  })

  it('shows a connection message when the network is down', async () => {
    mockSignIn.mockResolvedValue({ ok: false, failure: 'NETWORK' })
    await render(<SignInScreen />)

    await fillAndSubmit('cook@example.com', 'any-password')

    expect(
      await screen.findByText(
        'No connection. Check your internet and try again.',
      ),
    ).toBeTruthy()
  })

  it('sends one request even when the button is pressed twice', async () => {
    let finishSignIn: (result: { ok: true }) => void = () => {}
    mockSignIn.mockReturnValue(
      new Promise((resolve) => {
        finishSignIn = resolve
      }),
    )
    await render(<SignInScreen />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'cook@example.com')
    await user.type(screen.getByLabelText('Password'), 'any-password')

    await user.press(screen.getByRole('button', { name: 'Log in' }))
    await user.press(screen.getByRole('button', { name: 'Log in' }))

    expect(mockSignIn).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('button', { name: 'Log in' }).props.accessibilityState,
    ).toMatchObject({ busy: true, disabled: true })
    finishSignIn({ ok: true })
  })

  it('hides the password until the user asks to show it', async () => {
    await render(<SignInScreen />)
    const user = userEvent.setup()

    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true)

    await user.press(screen.getByRole('button', { name: 'Show password' }))

    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false)
  })

  it('offers a way to create an account', async () => {
    await render(<SignInScreen />)

    expect(
      screen.getByRole('link', { name: 'New here? Create an account' }),
    ).toBeTruthy()
  })
})
