import { toOptions } from './options'

describe('toOptions', () => {
  it('pairs every value with its label', () => {
    expect(
      toOptions(['A', 'B'] as const, (value) => value.toLowerCase()),
    ).toEqual([
      { value: 'A', label: 'a' },
      { value: 'B', label: 'b' },
    ])
  })
})
