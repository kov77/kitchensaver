import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { signIn, signOut, signUp } from './authActions'
import { supabase } from './supabase'
import type { SessionContextValue, SessionState } from './types'
import { useAutoRefresh } from './useAutoRefresh'

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useAutoRefresh()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setState({ status: 'signedIn', session })
        return
      }
      queryClient.clear()
      setState({ status: 'signedOut' })
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  const value = useMemo(() => ({ state, signIn, signUp, signOut }), [state])

  return <SessionContext value={value}>{children}</SessionContext>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (value === null) {
    throw new Error('useSession must be used inside SessionProvider')
  }
  return value
}
