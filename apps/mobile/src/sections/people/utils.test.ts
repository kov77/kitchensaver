import { PEOPLE_TEXT } from './constants'
import { describeGoal, describeReadiness, getInitial } from './utils'

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

describe('describeGoal', () => {
  it('names the goal and the daily calories', () => {
    expect(
      describeGoal({ mode: 'MANUAL', goalType: 'LOSE', dailyKcal: 2100 }),
    ).toBe('Lose weight · 2,100 kcal/day')
  })

  it('says so when there is no goal yet', () => {
    expect(describeGoal(null)).toBe(PEOPLE_TEXT.noGoal)
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
