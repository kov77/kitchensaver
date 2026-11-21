import { allergySchema } from './schemas'

describe('allergy schema', () => {
  it('rejects a custom allergy label longer than the server accepts', () => {
    const result = allergySchema.safeParse({
      answer: 'yes',
      allergens: ['OTHER'],
      otherLabel: 'x'.repeat(81),
    })

    expect(result.success).toBe(false)
  })
})
