import {
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native'

import { Stepper } from './Stepper'

function renderStepper(value: number, isDisabled = false) {
  const onChange = jest.fn()
  return {
    onChange,
    ready: render(
      <Stepper
        value={value}
        min={1}
        max={5}
        label="Rating of Kiwi"
        decreaseLabel="Lower the rating of Kiwi"
        increaseLabel="Raise the rating of Kiwi"
        isDisabled={isDisabled}
        onChange={onChange}
      />,
    ),
  }
}

function press(name: string) {
  return userEvent.setup().press(screen.getByRole('button', { name }))
}

describe('Stepper', () => {
  it('shows the value', async () => {
    await renderStepper(4).ready

    expect(screen.getByText('4')).toBeTruthy()
  })

  it('is one adjustable control for screen readers, with its value and limits', async () => {
    await renderStepper(4).ready

    const control = screen.getByLabelText('Rating of Kiwi')

    expect(control.props.accessibilityRole).toBe('adjustable')
    expect(control.props.accessibilityValue).toEqual({
      min: 1,
      max: 5,
      now: 4,
      text: '4',
    })
  })

  it('goes one step up and one step down', async () => {
    const { onChange, ready } = renderStepper(3)
    await ready

    await press('Raise the rating of Kiwi')
    await press('Lower the rating of Kiwi')

    expect(onChange).toHaveBeenNthCalledWith(1, 4)
    expect(onChange).toHaveBeenNthCalledWith(2, 2)
  })

  it('cannot go below the minimum', async () => {
    const { onChange, ready } = renderStepper(1)
    await ready

    await press('Lower the rating of Kiwi')

    expect(onChange).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Raise the rating of Kiwi' }).props
        .accessibilityState,
    ).toMatchObject({ disabled: false })
  })

  it('cannot go above the maximum', async () => {
    const { onChange, ready } = renderStepper(5)
    await ready

    await press('Raise the rating of Kiwi')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores both arrows while disabled', async () => {
    const { onChange, ready } = renderStepper(3, true)
    await ready

    await press('Raise the rating of Kiwi')
    await press('Lower the rating of Kiwi')

    expect(onChange).not.toHaveBeenCalled()
  })

  describe('screen reader actions', () => {
    function triggerAction(actionName: string) {
      return fireEvent(
        screen.getByLabelText('Rating of Kiwi'),
        'accessibilityAction',
        {
          nativeEvent: { actionName },
        },
      )
    }

    it('increments and decrements by one', async () => {
      const { onChange, ready } = renderStepper(3)
      await ready

      await triggerAction('increment')
      await triggerAction('decrement')

      expect(onChange).toHaveBeenNthCalledWith(1, 4)
      expect(onChange).toHaveBeenNthCalledWith(2, 2)
    })

    it('does not go past the limits', async () => {
      const top = renderStepper(5)
      await top.ready
      await triggerAction('increment')

      expect(top.onChange).not.toHaveBeenCalled()
    })

    it('does not go below the minimum', async () => {
      const bottom = renderStepper(1)
      await bottom.ready
      await triggerAction('decrement')

      expect(bottom.onChange).not.toHaveBeenCalled()
    })

    it('does nothing while disabled', async () => {
      const { onChange, ready } = renderStepper(3, true)
      await ready

      await triggerAction('increment')
      await triggerAction('decrement')

      expect(onChange).not.toHaveBeenCalled()
    })

    it('ignores an action it does not know', async () => {
      const { onChange, ready } = renderStepper(3)
      await ready

      await triggerAction('activate')

      expect(onChange).not.toHaveBeenCalled()
    })
  })
})
