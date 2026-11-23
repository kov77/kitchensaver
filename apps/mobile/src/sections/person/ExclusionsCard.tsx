import { useTranslation } from 'react-i18next'

import { useExclusions } from '@/api/queries/useExclusions'
import { QueryContent } from '@/components/molecules/QueryContent'
import { SectionCard } from '@/components/molecules/SectionCard'

import { AddExclusionPanel } from './AddExclusionPanel'
import { ExclusionList } from './ExclusionList'

type ExclusionsCardProps = {
  personId: string
  personName: string
}

export function ExclusionsCard({ personId, personName }: ExclusionsCardProps) {
  const { t } = useTranslation('person')
  const exclusionsQuery = useExclusions(personId)

  return (
    <SectionCard title={t('exclusions-title')}>
      <QueryContent
        query={exclusionsQuery}
        failureMessage={t('exclusions-load-failed')}
        retryLabel={t('retry')}
      >
        {(exclusions) => (
          <>
            <ExclusionList
              personId={personId}
              personName={personName}
              exclusions={exclusions}
            />
            <AddExclusionPanel personId={personId} />
          </>
        )}
      </QueryContent>
    </SectionCard>
  )
}
