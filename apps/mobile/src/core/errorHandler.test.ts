import { ApiRequestError } from '@/utils/errors'

import { ERROR_MESSAGES } from './constants'
import { handleError } from './errorHandler'
import { dismissToast, getToasts } from './toast/toastStore'

const mockSignOut = jest.fn()

jest.mock('./auth/supabase', () => ({
  supabase: {
    auth: {
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}))

function toastMessages() {
  return getToasts().map(({ message }) => message)
}

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  getToasts().forEach(({ id }) => dismissToast(id))
})

describe('handleError', () => {
  it('shows a plain message for a server error', () => {
    handleError(new ApiRequestError(500))

    expect(toastMessages()).toEqual([ERROR_MESSAGES.SERVER])
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('signs out locally and explains why on a 401', () => {
    handleError(new ApiRequestError(401))

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(toastMessages()).toEqual([ERROR_MESSAGES.SESSION_EXPIRED])
  })

  it('does not sign out for other client errors', () => {
    handleError(new ApiRequestError(403))
    handleError(new ApiRequestError(404))

    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('skips only the toast when the screen handles the error itself', () => {
    handleError(new ApiRequestError(500), { skipGlobalError: true })

    expect(toastMessages()).toEqual([])
  })

  it('still signs out on a 401 when the toast is skipped', () => {
    handleError(new ApiRequestError(401), { skipGlobalError: true })

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(toastMessages()).toEqual([])
  })

  it('never shows the technical message of an unexpected error', () => {
    handleError(new Error('SQLSTATE 42P01 relation people does not exist'))

    expect(toastMessages()).toEqual([ERROR_MESSAGES.UNKNOWN])
  })
})
