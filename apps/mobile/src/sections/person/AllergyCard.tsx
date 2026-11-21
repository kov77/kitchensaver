import { View } from 'react-native'

import { useAllergies } from '@/api/queries/useAllergies'
import type { PersonDetail } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { SectionCard } from '@/components/molecules/SectionCard'
import { ALLERGEN_LABELS } from '@/core/constants'

import { ALLERGY_STATUS_TEXT, PERSON_TEXT } from './constants'
import { styles } from './PersonScreen.styles'

type AllergyCardProps = {
  personId: string
  allergyStatus: PersonDetail['allergyStatus']
}

function AllergyList({ personId }: { personId: string }) {
  const {
    data: allergies,
    error,
    isFetching,
    isPending,
    refetch,
  } = useAllergies(personId)

  if (isPending && !error) return <Spinner />
  if (!allergies || allergies.length === 0) {
    return (
      <>
        <Text variant="body" color="warning">
          {PERSON_TEXT.allergyLoadFailed}
        </Text>
        <Button
          title={PERSON_TEXT.retry}
          variant="secondary"
          isLoading={isFetching}
          onPress={() => void refetch()}
        />
      </>
    )
  }

  return (
    <View style={styles.list}>
      {allergies.map(({ id, allergenCode, customLabel }) => (
        <Text key={id} variant="body">
          {customLabel ?? ALLERGEN_LABELS[allergenCode]}
        </Text>
      ))}
    </View>
  )
}

export function AllergyCard({ personId, allergyStatus }: AllergyCardProps) {
  return (
    <SectionCard title={PERSON_TEXT.allergyTitle}>
      {allergyStatus === 'HAS_ALLERGIES' ? (
        <AllergyList personId={personId} />
      ) : (
        <Text variant="body">
          {ALLERGY_STATUS_TEXT[allergyStatus ?? 'NOT_ANSWERED']}
        </Text>
      )}
    </SectionCard>
  )
}
