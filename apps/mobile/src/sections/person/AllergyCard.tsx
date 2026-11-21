import { View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { useAllergies } from '@/api/queries/useAllergies'
import type { PersonDetail } from '@/api/types'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { SectionCard } from '@/components/molecules/SectionCard'
import { ALLERGEN_LABEL_KEYS } from '@/core/constants'

import { ALLERGY_STATUS_LABEL_KEYS } from './constants'
import { styles } from './PersonScreen.styles'

type AllergyCardProps = {
  personId: string
  allergyStatus: PersonDetail['allergyStatus']
}

function AllergyList({ personId }: { personId: string }) {
  const { t } = useTranslation(['person', 'common'])
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
          {t('allergy-load-failed')}
        </Text>
        <Button
          title={t('retry')}
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
          {customLabel ?? t(ALLERGEN_LABEL_KEYS[allergenCode])}
        </Text>
      ))}
    </View>
  )
}

export function AllergyCard({ personId, allergyStatus }: AllergyCardProps) {
  const { t } = useTranslation(['person', 'common'])
  return (
    <SectionCard title={t('allergy-title')}>
      {allergyStatus === 'HAS_ALLERGIES' ? (
        <AllergyList personId={personId} />
      ) : (
        <Text variant="body">
          {t(ALLERGY_STATUS_LABEL_KEYS[allergyStatus ?? 'NOT_ANSWERED'])}
        </Text>
      )}
    </SectionCard>
  )
}
