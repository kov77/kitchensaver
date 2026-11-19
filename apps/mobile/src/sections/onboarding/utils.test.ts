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
      allergies({ answer: ALLERGY_ANSWER.NO }),
    )

    expect(body.dateOfBirth).toBe('1990-05-15')
    expect(body.name).toBe('Alex')
  })

  it('lists the chosen allergens and the custom one with its label', () => {
    const body = buildOnboardingBody(
      PROFILE,
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
        buildOnboardingBody(PROFILE, allergies({ answer })).allergies,
      ).toEqual({
        status,
        warningAcknowledged: true,
      })
    },
  )

  it('refuses to build a request while the allergy question is unanswered', () => {
    expect(() =>
      buildOnboardingBody(PROFILE, allergies({ answer: null })),
    ).toThrow()
  })
})
