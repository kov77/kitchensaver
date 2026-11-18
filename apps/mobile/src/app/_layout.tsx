import { QueryClientProvider } from '@tanstack/react-query'
import type { ErrorBoundaryProps } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { ToastHost } from '@/components/organisms/ToastHost'
import { AccountUnavailable } from '@/components/templates/AccountUnavailable'
import { ErrorFallback } from '@/components/templates/ErrorFallback'
import { RootNavigator } from '@/components/templates/RootNavigator'
import { SessionProvider, useSession } from '@/core/auth/SessionProvider'
import { queryClient } from '@/core/queryClient'
import { useAppAccess } from '@/core/useAppAccess'

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ErrorFallback onRetry={() => void retry()} />
}

function AppNavigation() {
  const { signOut } = useSession()
  const { access, errorMessage, isRetrying, retry } = useAppAccess()

  if (access === 'unavailable') {
    return (
      <AccountUnavailable
        message={errorMessage}
        isRetrying={isRetrying}
        onRetry={retry}
        onLogOut={() => void signOut()}
      />
    )
  }

  return <RootNavigator access={access} />
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <StatusBar style="auto" />
        <AppNavigation />
        <ToastHost />
      </SessionProvider>
    </QueryClientProvider>
  )
}
