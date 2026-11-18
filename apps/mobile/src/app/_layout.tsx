import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { SplashScreen, type ErrorBoundaryProps } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { ToastHost } from '@/components/organisms/ToastHost'
import { ErrorFallback } from '@/components/templates/ErrorFallback'
import { RootNavigator } from '@/components/templates/RootNavigator'
import { SessionProvider } from '@/core/auth/SessionProvider'
import { queryClient } from '@/core/queryClient'
import { fontFiles } from '@/theme/fonts'

void SplashScreen.preventAutoHideAsync()

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ErrorFallback onRetry={() => void retry()} />
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts(fontFiles)
  const fontsSettled = fontsLoaded || fontsError !== null

  useEffect(() => {
    if (fontsSettled) void SplashScreen.hideAsync()
  }, [fontsSettled])

  if (!fontsSettled) return null

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
