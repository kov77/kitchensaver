import { useRouter } from 'expo-router'
import { View } from 'react-native'

import { usePeople } from '@/api/queries/usePeople'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import { useSession } from '@/core/auth/SessionProvider'
import { getErrorMessage } from '@/utils/errors'

import { PEOPLE_TEXT } from './constants'
import { styles } from './PeopleScreen.styles'
import { PersonCard } from './PersonCard'

export function PeopleScreen() {
  const { signOut } = useSession()
  const router = useRouter()
  const {
    data: people,
    error,
    isFetching,
    isPending,
    refetch,
  } = usePeople({ status: 'active' })

  return (
    <AppScreen>
      <ScreenHeader title={PEOPLE_TEXT.title} subtitle={PEOPLE_TEXT.subtitle} />
      {isPending ? <Spinner /> : null}
      {error && !people ? (
        <>
          <FormMessage message={getErrorMessage(error)} />
          <Button
            title={PEOPLE_TEXT.retry}
            variant="secondary"
            isLoading={isFetching}
            onPress={() => void refetch()}
          />
        </>
      ) : null}
      {people?.length === 0 ? (
        <Text variant="body" color="textMuted">
          {PEOPLE_TEXT.empty}
        </Text>
      ) : null}
      {people ? (
        <View style={styles.list}>
          {people.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onPress={() =>
                router.push({
                  pathname: '/goal/[personId]',
                  params: { personId: person.id },
                })
              }
            />
          ))}
        </View>
      ) : null}
      <Button
        title={PEOPLE_TEXT.logOut}
        variant="secondary"
        onPress={() => void signOut()}
      />
    </AppScreen>
  )
}
