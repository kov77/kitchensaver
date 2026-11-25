import { exclusionSchema, preferenceSchema } from './schemas'

function errorsOf(
  schema: typeof exclusionSchema | typeof preferenceSchema,
  values: object,
) {
  const result = schema.safeParse(values)
  return result.success ? [] : result.error.issues.map(({ message }) => message)
}

describe('exclusion schema', () => {
  it('asks for a food', () => {
    expect(errorsOf(exclusionSchema, { ingredientName: '' })).toEqual([
      'This field is required.',
    ])
  })

  it('treats spaces as empty', () => {
    expect(errorsOf(exclusionSchema, { ingredientName: '   ' })).toEqual([
      'This field is required.',
    ])
  })

  it('accepts the longest name the server accepts and rejects one more', () => {
    expect(
      errorsOf(exclusionSchema, { ingredientName: 'x'.repeat(80) }),
    ).toEqual([])
    expect(
      errorsOf(exclusionSchema, { ingredientName: 'x'.repeat(81) }),
    ).toEqual(['Use at most 80 characters.'])
  })

  it('does not count the spaces around the name', () => {
    expect(
      errorsOf(exclusionSchema, { ingredientName: ` ${'x'.repeat(80)} ` }),
    ).toEqual([])
  })
})

describe('preference schema', () => {
  it.each([1, 2, 3, 4, 5])('accepts the rating %s', (rating) => {
    expect(
      errorsOf(preferenceSchema, { ingredientName: 'Kiwi', rating }),
    ).toEqual([])
  })

  it.each([0, 6, 2.5, -1, '3', null])('rejects the rating %j', (rating) => {
    expect(
      errorsOf(preferenceSchema, { ingredientName: 'Kiwi', rating }),
    ).not.toEqual([])
  })

  it('asks for a food', () => {
    expect(
      errorsOf(preferenceSchema, { ingredientName: '', rating: 3 }),
    ).toEqual(['This field is required.'])
  })
})
