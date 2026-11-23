import { ALLERGY_ANSWER } from '@/components/organisms/allergy/constants'
import type { AllergyAnswerValues } from '@/components/organisms/allergy/schemas'

import { buildOnboardingBody, onboardingFlowReducer } from './utils'

const PROFILE = { name: 'Alex', dateOfBirth: new Date(1990, 4, 15) }

function allergies(
  overrides: Partial<AllergyAnswerValues>,
): AllergyAnswerValues {
  return { answer: null, allergens: [], otherLabel: '', ...overrides }
}

describe('buildOnboardingBody', () => {
  it('sends the date of birth as a calendar date', () => {
    const body = buildOnboardingBody(
      PROFILE,
      null,
      allergies({ answer: ALLERGY_ANSWER.NO }),
    )

    expect(body.dateOfBirth).toBe('1990-05-15')
    expect(body.name).toBe('Alex')
  })

  it('leaves the goal out when it was skipped', () => {
    const body = buildOnboardingBody(
      PROFILE,
      null,
      allergies({ answer: ALLERGY_ANSWER.NO }),
    )

    expect(body).not.toHaveProperty('goal')
  })

  it('includes a goal the user set', () => {
    const body = buildOnboardingBody(
      PROFILE,
      { mode: 'MANUAL', goalType: 'MAINTAIN', dailyKcal: 2200 },
      allergies({ answer: ALLERGY_ANSWER.NO }),
    )

    expect(body.goal).toEqual({
      mode: 'MANUAL',
      goalType: 'MAINTAIN',
      dailyKcal: 2200,
    })
  })

  it('lists the chosen allergens and the custom one with its label', () => {
    const body = buildOnboardingBody(
      PROFILE,
      null,
      allergies({
        answer: ALLERGY_ANSWER.YES,
        allergens: ['MILK', 'OTHER'],
        otherLabel: 'Kiwi',
      }),
    )

    expect(body.allergies).toEqual({
      status: 'HAS_ALLERGIES',
      items: [
        { allergenCode: 'MILK' },
        { allergenCode: 'OTHER', customLabel: 'Kiwi' },
      ],
    })
  })

  it.each([
    [ALLERGY_ANSWER.NO, 'NONE'],
    [ALLERGY_ANSWER.UNKNOWN, 'UNKNOWN'],
  ] as const)(
    'records %s together with the acknowledged warning',
    (answer, status) => {
      expect(
        buildOnboardingBody(PROFILE, null, allergies({ answer })).allergies,
      ).toEqual({
        status,
        warningAcknowledged: true,
      })
    },
  )

  it('refuses to build a request while the allergy question is unanswered', () => {
    expect(() =>
      buildOnboardingBody(PROFILE, null, allergies({ answer: null })),
    ).toThrow()
  })
})

describe('onboardingFlowReducer', () => {
  const GOAL = { mode: 'MANUAL', goalType: 'CUSTOM', dailyKcal: 2000 } as const
  const START = { step: 'profile', profile: null } as const

  it('moves from the profile to the goal step with the profile', () => {
    expect(
      onboardingFlowReducer(START, {
        type: 'profileSubmitted',
        profile: PROFILE,
      }),
    ).toEqual({ step: 'goal', profile: PROFILE })
  })

  it('moves from the goal to the allergy step with the chosen goal', () => {
    expect(
      onboardingFlowReducer(
        { step: 'goal', profile: PROFILE },
        { type: 'goalChosen', goal: GOAL },
      ),
    ).toEqual({ step: 'allergies', profile: PROFILE, goal: GOAL })
  })

  it('keeps no goal when the step was skipped', () => {
    expect(
      onboardingFlowReducer(
        { step: 'goal', profile: PROFILE },
        { type: 'goalChosen', goal: null },
      ),
    ).toEqual({ step: 'allergies', profile: PROFILE, goal: null })
  })

  it('ignores a goal that arrives outside the goal step', () => {
    expect(
      onboardingFlowReducer(START, { type: 'goalChosen', goal: GOAL }),
    ).toBe(START)
  })

  it('goes back one step at a time and keeps the profile', () => {
    const allergies = {
      step: 'allergies',
      profile: PROFILE,
      goal: GOAL,
    } as const

    const goal = onboardingFlowReducer(allergies, { type: 'back' })
    const profile = onboardingFlowReducer(goal, { type: 'back' })

    expect(goal).toEqual({ step: 'goal', profile: PROFILE })
    expect(profile).toEqual({ step: 'profile', profile: PROFILE })
  })

  it('stays on the first step when going back from it', () => {
    expect(onboardingFlowReducer(START, { type: 'back' })).toBe(START)
  })
})
