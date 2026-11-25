import { signInSchema, signUpSchema } from './schemas'

function messagesOf(
  schema: typeof signInSchema | typeof signUpSchema,
  values: object,
) {
  const result = schema.safeParse({
    email: 'cook@example.com',
    password: 'a-long-enough-password',
    ...values,
  })
  return result.success ? [] : result.error.issues.map(({ message }) => message)
}

describe('sign-in schema', () => {
  it.each(['', '   '])('asks for an email that is %j', (email) => {
    expect(messagesOf(signInSchema, { email })).toEqual([
      'This field is required.',
    ])
  })

  it('names an email that is not valid differently from a missing one', () => {
    expect(messagesOf(signInSchema, { email: 'not-an-email' })).toEqual([
      'Enter a valid email address.',
    ])
  })

  it('asks for a password', () => {
    expect(messagesOf(signInSchema, { password: '' })).toEqual([
      'This field is required.',
    ])
  })

  it('accepts a password made of spaces, as typed', () => {
    expect(messagesOf(signInSchema, { password: '   ' })).toEqual([])
  })
})

describe('sign-up schema', () => {
  it('asks for a password first, not for its length', () => {
    expect(messagesOf(signUpSchema, { password: '' })[0]).toBe(
      'This field is required.',
    )
  })

  it('says that a short password is short', () => {
    expect(messagesOf(signUpSchema, { password: 'short' })).toHaveLength(1)
    expect(messagesOf(signUpSchema, { password: 'short' })[0]).not.toBe(
      'This field is required.',
    )
  })
})
