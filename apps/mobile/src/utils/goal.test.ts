import { toSaveGoalBody } from './goal'

describe('toSaveGoalBody', () => {
  it('sends a manual goal with its type and calories only', () => {
    expect(
      toSaveGoalBody({ mode: 'MANUAL', goalType: 'CUSTOM', dailyKcal: 2000 }),
    ).toEqual({ mode: 'MANUAL', goalType: 'CUSTOM', dailyKcal: 2000 })
  })

  it('sends the inputs of an estimated goal so the server can recompute it', () => {
    expect(
      toSaveGoalBody({
        mode: 'ESTIMATED',
        goalType: 'MAINTAIN',
        dailyKcal: 2275,
        heightCm: 165,
        weightKg: 63,
        activityLevel: 'LOW_ACTIVE',
        formulaSex: 'FEMALE',
      }),
    ).toEqual({
      mode: 'ESTIMATED',
      goalType: 'MAINTAIN',
      dailyKcal: 2275,
      heightCm: 165,
      weightKg: 63,
      activityLevel: 'LOW_ACTIVE',
      formulaSex: 'FEMALE',
    })
  })
})
