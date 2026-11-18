import { MAX_VISIBLE_TOASTS, TOAST_DURATION_MS } from '../constants'
import {
  dismissToast,
  getToasts,
  showToast,
  subscribeToToasts,
} from './toastStore'

function dismissAll() {
  getToasts().forEach(({ id }) => dismissToast(id))
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  dismissAll()
  jest.useRealTimers()
})

describe('toastStore', () => {
  it('shows a toast with the info variant by default', () => {
    showToast({ message: 'Saved' })

    expect(getToasts()).toEqual([
      expect.objectContaining({ message: 'Saved', variant: 'info' }),
    ])
  })

  it('removes a toast after the display time', () => {
    showToast({ message: 'Saved' })

    jest.advanceTimersByTime(TOAST_DURATION_MS - 1)
    expect(getToasts()).toHaveLength(1)

    jest.advanceTimersByTime(1)
    expect(getToasts()).toHaveLength(0)
  })

  it('does not stack the same message twice', () => {
    showToast({ message: 'No connection', variant: 'error' })
    showToast({ message: 'No connection', variant: 'error' })

    expect(getToasts()).toHaveLength(1)
  })

  it('keeps only the newest toasts', () => {
    const messages = Array.from(
      { length: MAX_VISIBLE_TOASTS + 2 },
      (_, index) => `message ${index}`,
    )

    messages.forEach((message) => showToast({ message }))

    expect(getToasts().map(({ message }) => message)).toEqual(
      messages.slice(-MAX_VISIBLE_TOASTS),
    )
  })

  it('dismisses one toast and keeps the others', () => {
    showToast({ message: 'first' })
    showToast({ message: 'second' })
    const [first] = getToasts()

    dismissToast(first!.id)

    expect(getToasts().map(({ message }) => message)).toEqual(['second'])
  })

  it('notifies subscribers with a new list and stops after unsubscribe', () => {
    const listener = jest.fn()
    const unsubscribe = subscribeToToasts(listener)
    const before = getToasts()

    showToast({ message: 'Saved' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(getToasts()).not.toBe(before)

    unsubscribe()
    showToast({ message: 'Another' })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
