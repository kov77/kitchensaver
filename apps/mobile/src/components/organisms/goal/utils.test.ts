import { getAssumptionKey } from './utils'

describe('getAssumptionKey', () => {
  it('finds the text of a known assumption', () => {
    expect(getAssumptionKey('AGE_IN_COMPLETED_YEARS')).toBe(
      'assumptions-AGE_IN_COMPLETED_YEARS',
    )
  })

  it('falls back to a general text for an unknown assumption', () => {
    expect(getAssumptionKey('SOMETHING_NEW')).toBe('assumptions-unknown')
  })
})
