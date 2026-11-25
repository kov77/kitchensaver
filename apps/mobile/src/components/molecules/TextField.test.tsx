import { render, screen, userEvent } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'

import { TextField } from './TextField'

describe('TextField', () => {
  it('labels the input for assistive technology', async () => {
    await render(<TextField label="Email" />)

    expect(screen.getByLabelText('Email')).toBeTruthy()
  })

  it('draws no label above the input when there is none, and uses the given accessible name', async () => {
    await render(
      <TextField accessibilityLabel="Food" placeholder="For example, kiwi" />,
    )

    expect(screen.getByLabelText('Food')).toBeTruthy()
    expect(screen.queryByText('Food')).toBeNull()
    expect(screen.getByPlaceholderText('For example, kiwi')).toBeTruthy()
  })

  it('shows the error message when there is one', async () => {
    await render(
      <TextField label="Email" errorMessage="Enter a valid email." />,
    )

    expect(screen.getByText('Enter a valid email.')).toBeTruthy()
  })

  it('marks the input and the message in red when there is an error', async () => {
    await render(
      <TextField label="Email" errorMessage="Enter a valid email." />,
    )

    expect(
      StyleSheet.flatten(screen.getByLabelText('Email').parent?.props.style),
    ).toMatchObject({ borderColor: colors.danger })
    expect(
      StyleSheet.flatten(screen.getByText('Enter a valid email.').props.style),
    ).toMatchObject({ color: colors.danger })
  })

  it('keeps the normal border without an error', async () => {
    await render(<TextField label="Email" />)

    expect(
      StyleSheet.flatten(screen.getByLabelText('Email').parent?.props.style),
    ).toMatchObject({ borderColor: colors.border })
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
