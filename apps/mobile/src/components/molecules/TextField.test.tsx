import { render, screen, userEvent } from '@testing-library/react-native'

import { TextField } from './TextField'

describe('TextField', () => {
  it('labels the input for assistive technology', async () => {
    await render(<TextField label="Email" />)

    expect(screen.getByLabelText('Email')).toBeTruthy()
  })

  it('shows the error message when there is one', async () => {
    await render(
      <TextField label="Email" errorMessage="Enter a valid email." />,
    )

    expect(screen.getByText('Enter a valid email.')).toBeTruthy()
  })

  it('shows no error text without an error', async () => {
    await render(<TextField label="Email" />)

    expect(screen.queryByText(/Enter/)).toBeNull()
  })

  it('does not offer a show button for a normal field', async () => {
    await render(<TextField label="Email" />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('hides a password until asked, then hides it again', async () => {
    await render(<TextField label="Password" isPassword />)
    const user = userEvent.setup()

    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true)

    await user.press(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false)

    await user.press(screen.getByRole('button', { name: 'Hide password' }))
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true)
  })

  it('passes input props through', async () => {
    const onChangeText = jest.fn()
    await render(<TextField label="Email" onChangeText={onChangeText} />)

    await userEvent.setup().type(screen.getByLabelText('Email'), 'a')

    expect(onChangeText).toHaveBeenCalledWith('a')
  })
})
