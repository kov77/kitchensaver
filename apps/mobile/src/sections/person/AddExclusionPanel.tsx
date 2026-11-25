import { useTranslation } from 'react-i18next'

import { useAddExclusion } from '@/api/queries/useAddExclusion'
import { Button } from '@/components/atoms/Button'
import { BottomSheet } from '@/components/molecules/BottomSheet'
import { ExclusionForm } from '@/components/organisms/ExclusionForm'
import { getErrorMessage } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

type AddExclusionPanelProps = {
  personId: string
}

export function AddExclusionPanel({ personId }: AddExclusionPanelProps) {
  const { t } = useTranslation('person')
  const [isAdding, { open: startAdding, close }] = useOpen()
  const {
    mutate: addExclusion,
    error,
    isPending,
    reset,
  } = useAddExclusion(personId)

  const stopAdding = () => {
    reset()
    close()
  }

  return (
    <>
      <Button
        title={t('exclusion-add')}
        variant="secondary"
        onPress={startAdding}
      />
      {isAdding ? (
        <BottomSheet
          title={t('exclusion-add')}
          closeLabel={t('close')}
          onClose={stopAdding}
        >
          <ExclusionForm
            submitLabel={t('add')}
            isSubmitting={isPending}
            errorMessage={error ? getErrorMessage(error) : null}
            onSubmit={({ ingredientName }) =>
              addExclusion(ingredientName, { onSuccess: stopAdding })
            }
          />
        </BottomSheet>
      ) : null}
    </>
  )
}
