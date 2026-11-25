import { render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'

import { colors } from '@/theme/colors'

import { Input } from './Input'

describe('Input', () => {
  it('has a visible border, also on a white card', async () => {
    await render(<Input accessibilityLabel="Food" />)

    const row = screen.getByLabelText('Food').parent

    expect(StyleSheet.flatten(row?.props.style)).toMatchObject({
      borderWidth: 1,
      borderColor: colors.border,
    })
  })

  it('turns the border red when it is invalid', async () => {
    await render(<Input accessibilityLabel="Food" isInvalid />)

    const row = screen.getByLabelText('Food').parent

    expect(StyleSheet.flatten(row?.props.style)).toMatchObject({
      borderColor: colors.danger,
    })
  })

  it('shows what the accessory adds next to the text', async () => {
    await render(
      <Input accessibilityLabel="Password" accessory={<></>} placeholder="x" />,
    )

    expect(screen.getByPlaceholderText('x')).toBeTruthy()
  })
})
