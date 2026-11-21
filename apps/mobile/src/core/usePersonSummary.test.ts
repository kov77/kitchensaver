import { renderHook } from '@testing-library/react-native'

import { usePersonSummary } from './usePersonSummary'

describe('describeGoal', () => {
  it('names the goal and the daily calories', async () => {
    const { result } = await renderHook(() => usePersonSummary())
    expect(
      result.current.describeGoal({
        mode: 'MANUAL',
        goalType: 'LOSE',
        dailyKcal: 2100,
      }),
    ).toBe('Lose weight · 2,100 kcal/day')
  })

  it('says so when there is no goal yet', async () => {
    const { result } = await renderHook(() => usePersonSummary())
    expect(result.current.describeGoal(null)).toBe('No goal yet')
  })
})

describe('describeReadiness', () => {
  it('shows nothing for a profile that is ready', async () => {
    const { result } = await renderHook(() => usePersonSummary())
    expect(
      result.current.describeReadiness({ ready: true, reasons: [] }),
    ).toBeNull()
  })

  it('lists every reason in plain words', async () => {
    const { result } = await renderHook(() => usePersonSummary())
    expect(
      result.current.describeReadiness({
        ready: false,
        reasons: ['MISSING_GOAL', 'ALLERGY_STATUS_MISSING'],
      }),
    ).toBe(
      'Not ready to plan: add a daily calorie goal, answer the allergy question',
    )
  })
})
