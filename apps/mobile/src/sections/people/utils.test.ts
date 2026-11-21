import { getInitial } from './utils'

describe('getInitial', () => {
  it('uppercases the first letter', () => {
    expect(getInitial('alena')).toBe('A')
  })

  it('ignores leading spaces', () => {
    expect(getInitial('  max')).toBe('M')
  })

  it('keeps a character outside the basic plane whole', () => {
    expect(getInitial('😀 Sam')).toBe('😀')
  })

  it('returns nothing for an empty name', () => {
    expect(getInitial('')).toBe('')
  })
})
