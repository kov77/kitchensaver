import { useTranslation } from 'react-i18next'

import { useAddAllergies } from '@/api/queries/useAddAllergies'
import type { PersonDetail } from '@/api/types'
import { SectionCard } from '@/components/molecules/SectionCard'

import { AllergyStatus } from './AllergyStatus'
import { ListedAllergies } from './ListedAllergies'

type AllergyCardProps = {
  personId: string
  personName: string
  allergyStatus: PersonDetail['allergyStatus']
}

export function AllergyCard({
  personId,
  personName,
  allergyStatus,
}: AllergyCardProps) {
  const { t } = useTranslation('person')
  const addAllergies = useAddAllergies(personId)

  return (
    <SectionCard title={t('allergy-title')}>
      {allergyStatus === 'HAS_ALLERGIES' ? (
        <ListedAllergies
          personId={personId}
          personName={personName}
          addAllergies={addAllergies}
        />
      ) : (
        <AllergyStatus
          personId={personId}
          allergyStatus={allergyStatus}
          addAllergies={addAllergies}
        />
      )}
    </SectionCard>
  )
}
