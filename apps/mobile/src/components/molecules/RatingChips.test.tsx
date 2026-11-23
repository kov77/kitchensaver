import { render, screen, userEvent } from '@testing-library/react-native'

import { RatingChips } from './RatingChips'

function renderChips(value: 1 | 2 | 3) {
  const onChange = jest.fn()
  return {
    onChange,
    ready: render(
      <RatingChips
        label="Rating of Kiwi"
        getOptionLabel={(option) => `Kiwi: ${option}`}
        values={[1, 2, 3] as const}
        value={value}
        onChange={onChange}
      />,
    ),
  }
}

describe('RatingChips', () => {
  it('is a labelled group with one option per value', async () => {
    await renderChips(2).ready

    expect(
      screen.getByLabelText('Rating of Kiwi').props.accessibilityRole,
    ).toBe('radiogroup')
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('marks only the current value as selected', async () => {
    await renderChips(2).ready

    expect(
      screen.getByRole('radio', { name: 'Kiwi: 2' }).props.accessibilityState,
    ).toMatchObject({ checked: true })
    expect(
      screen.getByRole('radio', { name: 'Kiwi: 1' }).props.accessibilityState,
    ).toMatchObject({ checked: false })
  })

  it('reports the value that was pressed', async () => {
    const { onChange, ready } = renderChips(2)
    await ready

    await userEvent
      .setup()
      .press(screen.getByRole('radio', { name: 'Kiwi: 3' }))

    expect(onChange).toHaveBeenCalledWith(3)
  })
})
