import { supabase } from '@/core/auth/supabase'
import { env } from '@/config/env'
import { createApiClient } from './client'

export const apiClient = createApiClient({
  baseUrl: env.EXPO_PUBLIC_API_URL,
  getAccessToken: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
  },
})
