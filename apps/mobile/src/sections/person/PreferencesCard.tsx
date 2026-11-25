import { useTranslation } from 'react-i18next'

import { usePreferences } from '@/api/queries/usePreferences'
import { QueryContent } from '@/components/molecules/QueryContent'
import { SectionCard } from '@/components/molecules/SectionCard'

import { AddPreferencePanel } from './AddPreferencePanel'
import { PreferenceList } from './PreferenceList'

type PreferencesCardProps = {
  personId: string
  personName: string
}

export function PreferencesCard({
  personId,
  personName,
}: PreferencesCardProps) {
  const { t } = useTranslation('person')
  const preferencesQuery = usePreferences(personId)

  return (
    <SectionCard title={t('preferences-title')}>
      <QueryContent
        query={preferencesQuery}
        failureMessage={t('preferences-load-failed')}
        retryLabel={t('retry')}
      >
        {(preferences) => (
          <>
            <PreferenceList
              personId={personId}
              personName={personName}
              preferences={preferences}
            />
            <AddPreferencePanel personId={personId} />
          </>
        )}
      </QueryContent>
    </SectionCard>
  )
}
