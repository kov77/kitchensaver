import { describe, expect, test } from 'vitest'

import { planReadiness } from './plan-readiness.js'

const manualGoal = {
  goalType: 'MAINTAIN',
  calculationMethod: null,
  reviewRequiredAt: null,
} as const

describe('planReadiness', () => {
  test('is not ready without a goal', () => {
    expect(planReadiness(30, null)).toEqual({
      ready: false,
      reasons: ['MISSING_GOAL'],
    })
  })

  test('is ready with a manual goal', () => {
    expect(planReadiness(30, manualGoal)).toEqual({ ready: true, reasons: [] })
  })

  test('asks for a review when the goal is marked for review', () => {
    expect(
      planReadiness(30, { ...manualGoal, reviewRequiredAt: new Date() }),
    ).toEqual({ ready: false, reasons: ['GOAL_REVIEW_REQUIRED'] })
  })

  test.each([
    ['DRI_2023_AGES_3_18', 18, true],
    ['DRI_2023_AGES_3_18', 19, false],
    ['DRI_2023_ADULT', 19, true],
    ['DRI_2023_ADULT', 18, false],
  ] as const)(
    'method %s at age %i -> ready %s',
    (calculationMethod, age, ready) => {
      expect(
        planReadiness(age, { ...manualGoal, calculationMethod }).ready,
      ).toBe(ready)
    },
  )

  test('keeps an estimated goal valid while the person ages inside one method range', () => {
    const goal = { ...manualGoal, calculationMethod: 'DRI_2023_ADULT' } as const

    expect(planReadiness(25, goal).ready).toBe(true)
    expect(planReadiness(80, goal).ready).toBe(true)
  })

  test('rejects a weight-loss goal for a person under 18', () => {
    expect(
      planReadiness(17, { ...manualGoal, goalType: 'LOSE' }).reasons,
    ).toEqual(['GOAL_NOT_VALID_FOR_AGE'])
    expect(planReadiness(18, { ...manualGoal, goalType: 'LOSE' }).ready).toBe(
      true,
    )
  })

  test('lists every reason', () => {
    expect(
      planReadiness(17, {
        goalType: 'LOSE',
        calculationMethod: 'DRI_2023_ADULT',
        reviewRequiredAt: new Date(),
      }).reasons,
    ).toEqual(['GOAL_REVIEW_REQUIRED', 'GOAL_NOT_VALID_FOR_AGE'])
  })
})
