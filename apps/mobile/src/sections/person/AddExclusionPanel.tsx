import { useTranslation } from 'react-i18next'

import { useAddExclusion } from '@/api/queries/useAddExclusion'
import { FormPanel } from '@/components/molecules/FormPanel'
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
    <FormPanel
      isOpen={isAdding}
      openLabel={t('exclusion-add')}
      cancelLabel={t('cancel')}
      onOpen={startAdding}
      onCancel={stopAdding}
    >
      <ExclusionForm
        submitLabel={t('save')}
        isSubmitting={isPending}
        errorMessage={error ? getErrorMessage(error) : null}
        onSubmit={({ ingredientName }) =>
          addExclusion(ingredientName, { onSuccess: stopAdding })
        }
      />
    </FormPanel>
  )
}
