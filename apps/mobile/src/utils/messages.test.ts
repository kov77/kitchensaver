import { lazyMessage } from './messages'

describe('lazyMessage', () => {
  it('translates when the message is requested, with the given values', () => {
    const { error } = lazyMessage('auth:field-errors-password-too-short', {
      min: 8,
    })

    expect(error()).toBe('Use at least 8 characters.')
  })
})
