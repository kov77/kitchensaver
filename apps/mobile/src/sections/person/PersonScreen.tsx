import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useDeletePerson } from '@/api/queries/useDeletePerson'
import { usePerson } from '@/api/queries/usePerson'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import { usePersonSummary } from '@/core/usePersonSummary'
import { getErrorMessage } from '@/utils/errors'

import { AllergyCard } from './AllergyCard'
import { DeletePerson } from './DeletePerson'
import { GoalCard } from './GoalCard'
import { ProfileCard } from './ProfileCard'

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
  const { describeReadiness } = usePersonSummary()
  const readinessHint = person ? describeReadiness(person.planReadiness) : null

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
        <>
          <ScreenHeader
            title={person.name}
            subtitle={`${person.age} ${t('years-old')}`}
          />
          {readinessHint ? (
            <Text variant="link" color="warning">
              {readinessHint}
            </Text>
          ) : null}
          <ProfileCard person={person} />
          <GoalCard
            goal={person.goal}
            onChangeGoal={() =>
              router.push({
                pathname: '/goal/[personId]',
                params: { personId: person.id },
              })
            }
          />
          <AllergyCard
            personId={person.id}
            allergyStatus={person.allergyStatus}
          />
          <DeletePerson
            name={person.name}
            isDeleting={isDeleting}
            error={deleteError}
            onDelete={() =>
              deletePerson(undefined, { onSuccess: () => router.back() })
            }
          />
        </>
      ) : null}
      <Button
        title={t('back')}
        variant="secondary"
        onPress={() => router.back()}
      />
    </AppScreen>
  )
}
