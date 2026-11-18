import { View } from 'react-native'

import { useMe } from '@/api/queries/useMe'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import { useSession } from '@/core/auth/SessionProvider'
import { getErrorMessage } from '@/utils/errors'

import { HOME_TEXT } from './constants'
import { styles } from './HomeScreen.styles'

export function HomeScreen() {
  const { signOut } = useSession()
  const { data, error, isPending, refetch } = useMe({ skipGlobalError: true })

  return (
    <AppScreen>
      <ScreenHeader title={HOME_TEXT.title} subtitle={HOME_TEXT.subtitle} />
      {isPending ? <Spinner /> : null}
      {error ? (
        <>
          <FormMessage message={getErrorMessage(error)} />
          <Button
            title={HOME_TEXT.retry}
            variant="secondary"
            onPress={() => void refetch()}
          />
        </>
      ) : null}
      {data ? (
        <View style={styles.details}>
          <Text variant="body">
            {HOME_TEXT.accountLabel}: {data.id}
          </Text>
          <Text variant="body">
            {HOME_TEXT.consentLabel}:{' '}
            {data.onboarding.complete
              ? HOME_TEXT.consentComplete
              : HOME_TEXT.consentRequired}
          </Text>
        </View>
      ) : null}
      <Button
        title={HOME_TEXT.logOut}
        variant="secondary"
        onPress={() => void signOut()}
      />
    </AppScreen>
  )
}
