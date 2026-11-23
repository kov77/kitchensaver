import { bodyParametersSchema } from './schemas'

const VALID = {
  heightCm: '180',
  weightKg: '75',
  activityLevel: 'ACTIVE',
  formulaSex: 'MALE',
}

function errorsOf(values: object) {
  const result = bodyParametersSchema.safeParse({ ...VALID, ...values })
  return result.success ? [] : result.error.issues.map(({ message }) => message)
}

describe('body parameters schema', () => {
  it('accepts valid values', () => {
    expect(errorsOf({})).toEqual([])
  })

  it.each(['90', '250', '172.5', '172,5'])(
    'accepts the height %s',
    (heightCm) => {
      expect(errorsOf({ heightCm })).toEqual([])
    },
  )

  it.each(['89', '251', '', 'tall', '1e2', '-170'])(
    'rejects the height %j',
    (heightCm) => {
      expect(errorsOf({ heightCm })).toEqual([
        'Enter a height between 90 and 250 cm.',
      ])
    },
  )

  it.each(['20', '400', '63,4'])('accepts the weight %s', (weightKg) => {
    expect(errorsOf({ weightKg })).toEqual([])
  })

  it.each(['19.9', '401', '', 'heavy'])('rejects the weight %j', (weightKg) => {
    expect(errorsOf({ weightKg })).toEqual([
      'Enter a weight between 20 and 400 kg.',
    ])
  })

  it('asks to choose the activity level and the sex', () => {
    expect(errorsOf({ activityLevel: null, formulaSex: null })).toEqual([
      'Choose an option.',
      'Choose an option.',
    ])
  })

  it('rejects an activity level the server does not know', () => {
    expect(errorsOf({ activityLevel: 'EXTREME' })).not.toEqual([])
  })
})
