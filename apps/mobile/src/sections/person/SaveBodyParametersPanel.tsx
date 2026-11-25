import { useTranslation } from 'react-i18next'

import { useSaveBodyParameters } from '@/api/queries/useSaveBodyParameters'
import type { StoredBodyParameters } from '@/api/types'
import { FormPanel } from '@/components/molecules/FormPanel'
import { BodyParametersForm } from '@/components/organisms/BodyParametersForm'
import { getErrorMessage } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

type SaveBodyParametersPanelProps = {
  personId: string
  parameters: StoredBodyParameters | null
}

export function SaveBodyParametersPanel({
  personId,
  parameters,
}: SaveBodyParametersPanelProps) {
  const { t } = useTranslation('person')
  const [isEditing, { open: startEditing, close }] = useOpen()
  const {
    mutate: saveParameters,
    error,
    isPending,
    reset,
  } = useSaveBodyParameters(personId)

  const stopEditing = () => {
    reset()
    close()
  }

  return (
    <FormPanel
      isOpen={isEditing}
      openLabel={parameters ? t('body-edit') : t('body-add')}
      cancelLabel={t('cancel')}
      onOpen={startEditing}
      onCancel={stopEditing}
    >
      <BodyParametersForm
        initialParameters={parameters}
        submitLabel={t('save')}
        isSubmitting={isPending}
        errorMessage={error ? getErrorMessage(error) : null}
        onSubmit={(newParameters) =>
          saveParameters(newParameters, { onSuccess: stopEditing })
        }
      />
    </FormPanel>
  )
}
