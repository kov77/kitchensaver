import { useEffect } from 'react'
import { AppState } from 'react-native'

import { supabase } from './supabase'

export function useAutoRefresh() {
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (appState) => {
        if (appState === 'active') {
          void supabase.auth.startAutoRefresh()
          return
        }
        void supabase.auth.stopAutoRefresh()
      },
    )
    if (AppState.currentState === 'active') {
      void supabase.auth.startAutoRefresh()
    }

    return () => {
      appStateSubscription.remove()
      void supabase.auth.stopAutoRefresh()
    }
  }, [])
}
