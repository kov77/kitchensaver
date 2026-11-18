import { QueryClientProvider } from '@tanstack/react-query'
import type { ErrorBoundaryProps } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { ToastHost } from '@/components/organisms/ToastHost'
import { ErrorFallback } from '@/components/templates/ErrorFallback'
import { RootNavigator } from '@/components/templates/RootNavigator'
import { SessionProvider } from '@/core/auth/SessionProvider'
import { queryClient } from '@/core/queryClient'

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ErrorFallback onRetry={() => void retry()} />
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <StatusBar style="auto" />
        <RootNavigator />
        <ToastHost />
      </SessionProvider>
    </QueryClientProvider>
  )
}
