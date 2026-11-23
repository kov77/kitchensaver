import { useTranslation } from 'react-i18next'

import { useBodyParameters } from '@/api/queries/useBodyParameters'
import { Text } from '@/components/atoms/Text'
import { QueryContent } from '@/components/molecules/QueryContent'
import { SectionCard } from '@/components/molecules/SectionCard'

import { BodyParametersSummary } from './BodyParametersSummary'
import { DeleteBodyParameters } from './DeleteBodyParameters'
import { SaveBodyParametersPanel } from './SaveBodyParametersPanel'

type BodyParametersCardProps = {
  personId: string
  personName: string
}

export function BodyParametersCard({
  personId,
  personName,
}: BodyParametersCardProps) {
  const { t } = useTranslation('person')
  const bodyParametersQuery = useBodyParameters(personId)

  return (
    <SectionCard title={t('body-title')}>
      <Text variant="body" color="textMuted">
        {t('body-explanation')}
      </Text>
      <QueryContent
        query={bodyParametersQuery}
        failureMessage={t('body-load-failed')}
        retryLabel={t('retry')}
      >
        {(parameters) => (
          <>
            <BodyParametersSummary parameters={parameters} />
            <SaveBodyParametersPanel
              personId={personId}
              parameters={parameters}
            />
            {parameters ? (
              <DeleteBodyParameters
                personId={personId}
                personName={personName}
              />
            ) : null}
          </>
        )}
      </QueryContent>
    </SectionCard>
  )
}
