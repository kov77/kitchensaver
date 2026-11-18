import { Stack } from 'expo-router'
import { View } from 'react-native'

import { Spinner } from '@/components/atoms/Spinner'
import { useSession } from '@/core/auth/SessionProvider'

import { styles } from './RootNavigator.styles'

export function RootNavigator() {
  const { state } = useSession()

  if (state.status === 'loading') {
    return (
      <View style={styles.loading}>
        <Spinner />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={state.status === 'signedIn'}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={state.status === 'signedOut'}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  )
}
