import { useLocalSearchParams, useRouter } from 'expo-router'

import { usePerson } from '@/api/queries/usePerson'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AppScreen } from '@/components/templates/AppScreen'
import { getErrorMessage } from '@/utils/errors'
import { describeReadiness } from '@/utils/person'

import { AllergyCard } from './AllergyCard'
import { PERSON_TEXT } from './constants'
import { GoalCard } from './GoalCard'
import { ProfileCard } from './ProfileCard'

export function PersonScreen() {
  const { personId } = useLocalSearchParams<{ personId: string }>()
  const router = useRouter()
  const {
    data: person,
    error,
    isFetching,
    isPending,
    refetch,
  } = usePerson(personId)
  const readinessHint = person ? describeReadiness(person.planReadiness) : null

  return (
    <AppScreen>
      {isPending && !error ? <Spinner /> : null}
      {error && !person ? (
        <>
          <FormMessage message={getErrorMessage(error)} />
          <Button
            title={PERSON_TEXT.retry}
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
            subtitle={`${person.age} ${PERSON_TEXT.yearsOld}`}
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
        </>
      ) : null}
      <Button
        title={PERSON_TEXT.back}
        variant="secondary"
        onPress={() => router.back()}
      />
    </AppScreen>
  )
}
