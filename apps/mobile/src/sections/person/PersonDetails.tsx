import { useRouter } from 'expo-router'

import type { PersonDetail } from '@/api/types'
import { Text } from '@/components/atoms/Text'
import { usePersonSummary } from '@/core/usePersonSummary'

import { AllergyCard } from './AllergyCard'
import { BodyParametersCard } from './BodyParametersCard'
import { DeletePerson } from './DeletePerson'
import { ExclusionsCard } from './ExclusionsCard'
import { GoalCard } from './GoalCard'
import { PreferencesCard } from './PreferencesCard'
import { ProfileHeader } from './ProfileHeader'

type PersonDetailsProps = {
  person: PersonDetail
  isDeleting: boolean
  deleteError: Error | null
  onDelete: () => void
}

export function PersonDetails({
  person,
  isDeleting,
  deleteError,
  onDelete,
}: PersonDetailsProps) {
  const { id, name, goal, planReadiness, allergyStatus } = person
  const router = useRouter()
  const { describeReadiness } = usePersonSummary()
  const readinessHint = describeReadiness(planReadiness)

  return (
    <>
      <ProfileHeader person={person} />
      {readinessHint ? (
        <Text variant="link" color="warning">
          {readinessHint}
        </Text>
      ) : null}
      <GoalCard
        goal={goal}
        onChangeGoal={() =>
          router.push({
            pathname: '/goal/[personId]',
            params: { personId: id },
          })
        }
      />
      <BodyParametersCard personId={id} personName={name} />
      <AllergyCard
        personId={id}
        personName={name}
        allergyStatus={allergyStatus}
      />
      <ExclusionsCard personId={id} personName={name} />
      <PreferencesCard personId={id} personName={name} />
      <DeletePerson
        name={name}
        isDeleting={isDeleting}
        error={deleteError}
        onDelete={onDelete}
      />
    </>
  )
}
