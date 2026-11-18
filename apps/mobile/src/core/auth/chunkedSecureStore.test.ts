import * as SecureStore from 'expo-secure-store'

import { chunkedSecureStore } from './chunkedSecureStore'

const mockStore = new Map<string, string>()

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value)
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key)
  }),
}))

const SESSION_KEY = 'sb-project-auth-token'
const LONG_VALUE = JSON.stringify({
  access_token: 'a'.repeat(1500),
  refresh_token: 'r'.repeat(40),
  user: { email: 'cook@example.com', metadata: 'm'.repeat(2500) },
})

beforeEach(() => {
  mockStore.clear()
  jest.clearAllMocks()
})

describe('chunkedSecureStore', () => {
  it('returns null for an unknown key', async () => {
    expect(await chunkedSecureStore.getItem(SESSION_KEY)).toBeNull()
  })

  it('round-trips a value much larger than one chunk', async () => {
    await chunkedSecureStore.setItem(SESSION_KEY, LONG_VALUE)

    expect(await chunkedSecureStore.getItem(SESSION_KEY)).toBe(LONG_VALUE)
  })

  it('never writes a chunk bigger than the limit', async () => {
    await chunkedSecureStore.setItem(SESSION_KEY, LONG_VALUE)

    const writtenLengths = jest
      .mocked(SecureStore.setItemAsync)
      .mock.calls.map(([, value]) => value.length)
    expect(Math.max(...writtenLengths)).toBeLessThanOrEqual(1024)
  })

  it('writes with the device-only, unlocked-only keychain option', async () => {
    await chunkedSecureStore.setItem(SESSION_KEY, LONG_VALUE)

    const optionsUsed = jest
      .mocked(SecureStore.setItemAsync)
      .mock.calls.map(([, , options]) => options)
    expect(optionsUsed).not.toHaveLength(0)
    expect(
      optionsUsed.every(
        (options) =>
          options?.keychainAccessible ===
          SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      ),
    ).toBe(true)
  })

  it('removes stale chunks when a shorter value replaces a longer one', async () => {
    await chunkedSecureStore.setItem(SESSION_KEY, LONG_VALUE)
    await chunkedSecureStore.setItem(SESSION_KEY, 'short')

    expect(await chunkedSecureStore.getItem(SESSION_KEY)).toBe('short')
    expect([...mockStore.keys()].sort()).toEqual([
      `${SESSION_KEY}.chunk0`,
      `${SESSION_KEY}.manifest`,
    ])
  })

  it('deletes every stored piece on removal', async () => {
    await chunkedSecureStore.setItem(SESSION_KEY, LONG_VALUE)
    await chunkedSecureStore.removeItem(SESSION_KEY)

    expect(mockStore.size).toBe(0)
    expect(await chunkedSecureStore.getItem(SESSION_KEY)).toBeNull()
  })

  it('treats a missing chunk as no session', async () => {
    await chunkedSecureStore.setItem(SESSION_KEY, LONG_VALUE)
    mockStore.delete(`${SESSION_KEY}.chunk1`)

    expect(await chunkedSecureStore.getItem(SESSION_KEY)).toBeNull()
  })

  it('treats a chunk of the wrong size as no session', async () => {
    await chunkedSecureStore.setItem(SESSION_KEY, LONG_VALUE)
    mockStore.set(`${SESSION_KEY}.chunk1`, 'truncated')

    expect(await chunkedSecureStore.getItem(SESSION_KEY)).toBeNull()
  })

  it('treats a corrupted manifest as no session', async () => {
    mockStore.set(`${SESSION_KEY}.manifest`, '{not json')

    expect(await chunkedSecureStore.getItem(SESSION_KEY)).toBeNull()
  })

  it('keeps different keys apart', async () => {
    await chunkedSecureStore.setItem('first', LONG_VALUE)
    await chunkedSecureStore.setItem('second', 'other')
    await chunkedSecureStore.removeItem('first')

    expect(await chunkedSecureStore.getItem('second')).toBe('other')
  })
})
