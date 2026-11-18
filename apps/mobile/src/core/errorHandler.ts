import { isUnauthorizedError, getErrorMessage } from '@/utils/errors'

import { supabase } from './auth/supabase'
import { SKIP_GLOBAL_ERROR_META_KEY } from './constants'
import { showToast } from './toast/toastStore'

export function handleError(error: unknown, meta?: Record<string, unknown>) {
  if (isUnauthorizedError(error)) {
    void supabase.auth.signOut({ scope: 'local' })
  }
  if (meta?.[SKIP_GLOBAL_ERROR_META_KEY]) return

  showToast({ message: getErrorMessage(error), variant: 'error' })
}
