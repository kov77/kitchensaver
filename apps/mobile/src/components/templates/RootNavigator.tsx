import { Stack } from 'expo-router'
import { View } from 'react-native'

import { Spinner } from '@/components/atoms/Spinner'
import type { AppAccess } from '@/core/types'

import { styles } from './RootNavigator.styles'

type RootNavigatorProps = {
  access: Exclude<AppAccess, 'unavailable'>
}

export function RootNavigator({ access }: RootNavigatorProps) {
  if (access === 'loading') {
    return (
      <View style={styles.loading}>
        <Spinner />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={access === 'ready'}>
        <Stack.Screen name="index" />
        <Stack.Screen name="add-person" />
        <Stack.Screen name="person/[personId]" />
        <Stack.Screen name="goal/[personId]" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'consentRequired'}>
        <Stack.Screen name="consent" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'onboardingRequired'}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'signedOut'}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  )
}
