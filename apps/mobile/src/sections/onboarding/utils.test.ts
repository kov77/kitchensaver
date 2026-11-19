import { ALLERGY_ANSWER } from './constants'
import type { AllergyValues } from './schemas'
import { buildOnboardingBody } from './utils'

const PROFILE = { name: 'Alex', dateOfBirth: new Date(1990, 4, 15) }

function allergies(overrides: Partial<AllergyValues>): AllergyValues {
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
