import { render, screen, userEvent } from '@testing-library/react-native'

import { SignUpScreen } from './SignUpScreen'

const mockSignUp = jest.fn()

jest.mock('@/core/auth/SessionProvider', () => ({
  useSession: () => ({ signUp: mockSignUp }),
}))

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.press(screen.getByRole('button', { name: 'Create account' }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SignUpScreen', () => {
  it('rejects a password shorter than 8 characters', async () => {
    await render(<SignUpScreen />)

    await fillAndSubmit('new@example.com', '1234567')

    expect(await screen.findByText('Use at least 8 characters.')).toBeTruthy()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('accepts a password of exactly 8 characters', async () => {
    mockSignUp.mockResolvedValue({ ok: true, emailConfirmationRequired: false })
    await render(<SignUpScreen />)

    await fillAndSubmit('new@example.com', '12345678')

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: '12345678',
    })
  })

  it('rejects a password longer than 72 characters', async () => {
    await render(<SignUpScreen />)

    await fillAndSubmit('new@example.com', 'a'.repeat(73))

    expect(await screen.findByText('Use at most 72 characters.')).toBeTruthy()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('rejects an invalid email', async () => {
    await render(<SignUpScreen />)

    await fillAndSubmit('new@', 'long-enough-password')

    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('asks the user to confirm the email when no session was created', async () => {
    mockSignUp.mockResolvedValue({ ok: true, emailConfirmationRequired: true })
    await render(<SignUpScreen />)

    await fillAndSubmit('new@example.com', 'long-enough-password')

    expect(
      await screen.findByText(
        'Check your email to confirm your account, then log in.',
      ),
    ).toBeTruthy()
  })

  it('shows no confirmation message when the user is signed in right away', async () => {
    mockSignUp.mockResolvedValue({ ok: true, emailConfirmationRequired: false })
    await render(<SignUpScreen />)

    await fillAndSubmit('new@example.com', 'long-enough-password')

    expect(mockSignUp).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Check your email/)).toBeNull()
  })

  it('shows a plain message when the email already has an account', async () => {
    mockSignUp.mockResolvedValue({ ok: false, failure: 'ACCOUNT_EXISTS' })
    await render(<SignUpScreen />)

    await fillAndSubmit('taken@example.com', 'long-enough-password')

    expect(
      await screen.findByText(
        'This email may already have an account. Try logging in.',
      ),
    ).toBeTruthy()
  })

  it('does not ask for a name or a consent checkbox yet', async () => {
    await render(<SignUpScreen />)

    expect(screen.queryByLabelText('Name')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })
})
