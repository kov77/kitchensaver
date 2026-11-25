import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useDeletePerson } from '@/api/queries/useDeletePerson'
import { usePerson } from '@/api/queries/usePerson'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { FormMessage } from '@/components/molecules/FormMessage'
import { AppScreen } from '@/components/templates/AppScreen'
import { getErrorMessage } from '@/utils/errors'

import { PersonDetails } from './PersonDetails'

export function PersonScreen() {
  const { t } = useTranslation('person')
  const { personId } = useLocalSearchParams<{ personId: string }>()
  const router = useRouter()
  const {
    mutate: deletePerson,
    error: deleteError,
    isPending: isDeleting,
    isSuccess: isDeleted,
  } = useDeletePerson(personId)
  const {
    data: person,
    error,
    isFetching,
    isPending,
    refetch,
  } = usePerson({ personId, enabled: !isDeleted })

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'))

  if (isDeleted) return null

  return (
    <AppScreen>
      {isPending && !error ? <Spinner /> : null}
      {error && !person ? (
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
      {person ? (
        <PersonDetails
          person={person}
          isDeleting={isDeleting}
          deleteError={deleteError}
          onDelete={() => deletePerson(undefined, { onSuccess: leave })}
        />
      ) : null}
      <Button title={t('back')} variant="secondary" onPress={leave} />
    </AppScreen>
  )
}
