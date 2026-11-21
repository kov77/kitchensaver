import { act, renderHook } from '@testing-library/react-native'

import { useOpen, useOpenValue } from './useOpen'

describe('useOpen', () => {
  it('starts closed', async () => {
    const { result } = await renderHook(() => useOpen())

    expect(result.current[0]).toBe(false)
  })

  it('can start open', async () => {
    const { result } = await renderHook(() => useOpen(true))

    expect(result.current[0]).toBe(true)
  })

  it('opens and closes', async () => {
    const { result } = await renderHook(() => useOpen())

    await act(async () => result.current[1].open())
    expect(result.current[0]).toBe(true)

    await act(async () => result.current[1].close())
    expect(result.current[0]).toBe(false)
  })

  it('stays open when opened twice', async () => {
    const { result } = await renderHook(() => useOpen())

    await act(async () => result.current[1].open())
    await act(async () => result.current[1].open())

    expect(result.current[0]).toBe(true)
  })

  it('toggles', async () => {
    const { result } = await renderHook(() => useOpen())

    await act(async () => result.current[1].toggle())
    expect(result.current[0]).toBe(true)

    await act(async () => result.current[1].toggle())
    expect(result.current[0]).toBe(false)
  })

  it('keeps the same actions between renders', async () => {
    const { result, rerender } = await renderHook(() => useOpen())
    const firstActions = result.current[1]

    await rerender({})

    expect(result.current[1]).toBe(firstActions)
  })
})

describe('useOpenValue', () => {
  it('starts without a value', async () => {
    const { result } = await renderHook(() => useOpenValue<string>())

    expect(result.current[0]).toBeNull()
  })

  it('holds the value it was opened with until it is closed', async () => {
    const { result } = await renderHook(() => useOpenValue<string>())

    await act(async () => result.current[1].open('peanut'))
    expect(result.current[0]).toBe('peanut')

    await act(async () => result.current[1].close())
    expect(result.current[0]).toBeNull()
  })

  it('replaces the value when opened with another one', async () => {
    const { result } = await renderHook(() => useOpenValue<string>())

    await act(async () => result.current[1].open('peanut'))
    await act(async () => result.current[1].open('milk'))

    expect(result.current[0]).toBe('milk')
  })
})
