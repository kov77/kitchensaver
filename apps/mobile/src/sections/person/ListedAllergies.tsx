import { useTranslation } from 'react-i18next'

import { useAllergies } from '@/api/queries/useAllergies'
import { FormMessage } from '@/components/molecules/FormMessage'
import { LoadFailure } from '@/components/molecules/LoadFailure'
import { QueryContent } from '@/components/molecules/QueryContent'
import { getErrorMessage } from '@/utils/errors'

import { AddAllergiesPanel } from './AddAllergiesPanel'
import { AllergyList } from './AllergyList'
import type { AddAllergies } from './types'

type ListedAllergiesProps = {
  personId: string
  personName: string
  addAllergies: AddAllergies
}

export function ListedAllergies({
  personId,
  personName,
  addAllergies,
}: ListedAllergiesProps) {
  const { t } = useTranslation('person')
  const allergiesQuery = useAllergies(personId)

  return (
    <QueryContent
      query={allergiesQuery}
      failureMessage={t('allergy-load-failed')}
      retryLabel={t('retry')}
    >
      {(allergies) =>
        allergies.length === 0 ? (
          <LoadFailure
            message={t('allergy-load-failed')}
            retryLabel={t('retry')}
            isRetrying={allergiesQuery.isFetching}
            onRetry={() => void allergiesQuery.refetch()}
          />
        ) : (
          <>
            <AllergyList
              personId={personId}
              personName={personName}
              allergies={allergies}
            />
            {addAllergies.error ? (
              <FormMessage
                message={t('allergy-add-failed', {
                  reason: getErrorMessage(addAllergies.error),
                })}
              />
            ) : null}
            <AddAllergiesPanel
              allergies={allergies}
              addAllergies={addAllergies}
            />
          </>
        )
      }
    </QueryContent>
  )
}
