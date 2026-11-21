import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { usePeople } from '@/api/queries/usePeople'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import { useSession } from '@/core/auth/SessionProvider'
import { getErrorMessage } from '@/utils/errors'

import { styles } from './PeopleScreen.styles'
import { PersonCard } from './PersonCard'

export function PeopleScreen() {
  const { t } = useTranslation('people')
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
      <ScreenHeader title={t('title')} subtitle={t('subtitle')} />
      {isPending ? <Spinner /> : null}
      {error && !people ? (
        <>
          <FormMessage message={getErrorMessage(error)} />
          <Button
            title={t('retry')}
            variant="secondary"
            isLoading={isFetching}
            onPress={() => void refetch()}
          />
        </>
      ) : null}
      {people?.length === 0 ? (
        <Text variant="body" color="textMuted">
          {t('empty')}
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
                  pathname: '/person/[personId]',
                  params: { personId: person.id },
                })
              }
            />
          ))}
        </View>
      ) : null}
      <Button
        title={t('log-out')}
        variant="secondary"
        onPress={() => void signOut()}
      />
    </AppScreen>
  )
}
