import { useTranslation } from 'react-i18next'

import { useAllergies } from '@/api/queries/useAllergies'
import { Button } from '@/components/atoms/Button'
import { Spinner } from '@/components/atoms/Spinner'
import { Text } from '@/components/atoms/Text'
import { FormMessage } from '@/components/molecules/FormMessage'
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
      <AddAllergiesPanel allergies={allergies} addAllergies={addAllergies} />
    </>
  )
}
