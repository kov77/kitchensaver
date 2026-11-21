import { PERSON_SUMMARY_TEXT } from '@/core/constants'

import { describeGoal, describeReadiness } from './person'

describe('describeGoal', () => {
  it('names the goal and the daily calories', () => {
    expect(
      describeGoal({ mode: 'MANUAL', goalType: 'LOSE', dailyKcal: 2100 }),
    ).toBe('Lose weight · 2,100 kcal/day')
  })

  it('says so when there is no goal yet', () => {
    expect(describeGoal(null)).toBe(PERSON_SUMMARY_TEXT.noGoal)
  })
})

describe('describeReadiness', () => {
  it('shows nothing for a profile that is ready', () => {
    expect(describeReadiness({ ready: true, reasons: [] })).toBeNull()
  })

  it('lists every reason in plain words', () => {
    expect(
      describeReadiness({
        ready: false,
        reasons: ['MISSING_GOAL', 'ALLERGY_STATUS_MISSING'],
      }),
    ).toBe(
      'Not ready to plan: add a daily calorie goal, answer the allergy question',
    )
  })
})
