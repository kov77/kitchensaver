import { render, screen, userEvent } from '@testing-library/react-native'

import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('reports the opposite state when pressed', async () => {
    const onChange = jest.fn()
    await render(
      <Checkbox
        label="I am 18 or older"
        isChecked={false}
        onChange={onChange}
      />,
    )

    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: 'I am 18 or older' }))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('exposes its checked state to assistive technology', async () => {
    await render(<Checkbox label="Accept" isChecked onChange={jest.fn()} />)

    expect(screen.getByRole('checkbox', { name: 'Accept' })).toBeChecked()
  })

  it('can be unchecked again', async () => {
    const onChange = jest.fn()
    await render(<Checkbox label="Accept" isChecked onChange={onChange} />)

    await userEvent
      .setup()
      .press(screen.getByRole('checkbox', { name: 'Accept' }))

    expect(onChange).toHaveBeenCalledWith(false)
  })
})
