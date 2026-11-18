import { parseEnv } from './parseEnv'

const VALID_ENV = {
  EXPO_PUBLIC_API_URL: 'http://192.168.0.10:3000',
  EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'publishable-key',
}

describe('parseEnv', () => {
  it('accepts a complete configuration', () => {
    expect(parseEnv(VALID_ENV)).toEqual(VALID_ENV)
  })

  it('names the missing variable', () => {
    expect(() =>
      parseEnv({ ...VALID_ENV, EXPO_PUBLIC_SUPABASE_ANON_KEY: undefined }),
    ).toThrow('EXPO_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('rejects an empty publishable key', () => {
    expect(() =>
      parseEnv({ ...VALID_ENV, EXPO_PUBLIC_SUPABASE_ANON_KEY: '' }),
    ).toThrow('EXPO_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('rejects a Supabase URL that is not https', () => {
    expect(() =>
      parseEnv({
        ...VALID_ENV,
        EXPO_PUBLIC_SUPABASE_URL: 'http://project.supabase.co',
      }),
    ).toThrow('EXPO_PUBLIC_SUPABASE_URL')
  })

  it('does not put the rejected value into the error message', () => {
    expect(() =>
      parseEnv({ ...VALID_ENV, EXPO_PUBLIC_API_URL: 'secret-looking-value' }),
    ).not.toThrow('secret-looking-value')
  })
})
