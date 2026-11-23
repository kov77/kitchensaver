import { toBodyParameters, toBodyParametersValues } from './utils'

const PARAMETERS = {
  heightCm: 172.5,
  weightKg: 63,
  activityLevel: 'LOW_ACTIVE',
  formulaSex: 'FEMALE',
} as const

describe('toBodyParametersValues', () => {
  it('is empty when nothing is saved', () => {
    expect(toBodyParametersValues(null)).toEqual({
      heightCm: '',
      weightKg: '',
      activityLevel: null,
      formulaSex: null,
    })
  })

  it('writes the numbers as text for the fields', () => {
    expect(toBodyParametersValues(PARAMETERS)).toEqual({
      heightCm: '172.5',
      weightKg: '63',
      activityLevel: 'LOW_ACTIVE',
      formulaSex: 'FEMALE',
    })
  })

  it('does not carry fields that are not body parameters', () => {
    const stored = { ...PARAMETERS, updatedAt: '2026-11-01T10:00:00.000Z' }

    const values = toBodyParametersValues(stored)

    expect(Object.keys(values).sort()).toEqual([
      'activityLevel',
      'formulaSex',
      'heightCm',
      'weightKg',
    ])
  })
})

describe('toBodyParameters', () => {
  it('reads the text of the fields as numbers, with a decimal comma too', () => {
    expect(
      toBodyParameters({
        heightCm: '172,5',
        weightKg: ' 63 ',
        activityLevel: 'LOW_ACTIVE',
        formulaSex: 'FEMALE',
      }),
    ).toEqual(PARAMETERS)
  })

  it.each([
    ['height', { heightCm: 'x' }],
    ['weight', { weightKg: '' }],
    ['activity level', { activityLevel: null }],
    ['sex', { formulaSex: null }],
  ])('is null when the %s is missing', (_name, change) => {
    expect(
      toBodyParameters({
        ...toBodyParametersValues(PARAMETERS),
        ...change,
      }),
    ).toBeNull()
  })

  it('round-trips with the values of the fields', () => {
    expect(toBodyParameters(toBodyParametersValues(PARAMETERS))).toEqual(
      PARAMETERS,
    )
  })
})
