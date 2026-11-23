import { choice } from './schemas'

const schema = choice(['LOW', 'HIGH'])

describe('choice', () => {
  it.each(['LOW', 'HIGH'])('accepts the option %s', (value) => {
    expect(schema.safeParse(value).success).toBe(true)
  })

  it('asks to choose when nothing is chosen', () => {
    const result = schema.safeParse(null)

    expect(result.success).toBe(false)
    expect(result.error?.issues.map(({ message }) => message)).toEqual([
      'Choose an option.',
    ])
  })

  it.each(['MEDIUM', '', 3, undefined])('rejects %j', (value) => {
    expect(schema.safeParse(value).success).toBe(false)
  })
})
