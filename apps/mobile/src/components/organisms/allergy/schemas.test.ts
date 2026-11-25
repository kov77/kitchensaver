import { allergenSelectionSchema, allergyAnswerSchema } from './schemas'

function answerErrors(values: object) {
  const result = allergyAnswerSchema.safeParse({
    answer: 'yes',
    allergens: [],
    otherLabel: '',
    ...values,
  })
  return result.success ? [] : result.error.issues.map(({ message }) => message)
}

function selectionErrors(values: object) {
  const result = allergenSelectionSchema.safeParse({
    allergens: [],
    otherLabel: '',
    ...values,
  })
  return result.success ? [] : result.error.issues.map(({ message }) => message)
}

describe('allergy answer schema', () => {
  it('asks for an answer', () => {
    expect(answerErrors({ answer: null })).toEqual(['This field is required.'])
  })

  it.each(['no', 'unknown'])(
    'accepts the answer %s without any allergen',
    (answer) => {
      expect(answerErrors({ answer })).toEqual([])
    },
  )

  it('asks for at least one allergen when the answer is yes', () => {
    expect(answerErrors({ answer: 'yes' })).toEqual(['This field is required.'])
  })

  it('does not ask for a label of the other allergen unless it is chosen', () => {
    expect(answerErrors({ allergens: ['MILK'] })).toEqual([])
  })

  it('asks for the label when the other allergen is chosen', () => {
    expect(answerErrors({ allergens: ['OTHER'] })).toEqual([
      'This field is required.',
    ])
  })

  it('treats a label of spaces as empty', () => {
    expect(answerErrors({ allergens: ['OTHER'], otherLabel: '   ' })).toEqual([
      'This field is required.',
    ])
  })

  it('accepts the other allergen with a label', () => {
    expect(answerErrors({ allergens: ['OTHER'], otherLabel: 'Kiwi' })).toEqual(
      [],
    )
  })

  it('rejects a custom label longer than the server accepts', () => {
    expect(
      answerErrors({ allergens: ['OTHER'], otherLabel: 'x'.repeat(81) }),
    ).toEqual(['Use at most 80 characters.'])
  })

  it('ignores a long label that is not used', () => {
    expect(
      answerErrors({ allergens: ['MILK'], otherLabel: 'x'.repeat(200) }),
    ).toEqual([])
    expect(answerErrors({ answer: 'no', otherLabel: 'x'.repeat(200) })).toEqual(
      [],
    )
  })

  it('accepts a label of exactly the longest accepted length', () => {
    expect(
      answerErrors({ allergens: ['OTHER'], otherLabel: 'x'.repeat(80) }),
    ).toEqual([])
  })

  it('rejects a code that is not an allergen', () => {
    expect(answerErrors({ allergens: ['CHOCOLATE'] })).not.toEqual([])
  })
})

describe('allergen selection schema', () => {
  it('asks for at least one allergen', () => {
    expect(selectionErrors({})).toEqual(['This field is required.'])
  })

  it('asks for the label when the other allergen is chosen', () => {
    expect(selectionErrors({ allergens: ['OTHER'] })).toEqual([
      'This field is required.',
    ])
  })

  it('accepts a listed allergen', () => {
    expect(selectionErrors({ allergens: ['SESAME'] })).toEqual([])
  })
})
