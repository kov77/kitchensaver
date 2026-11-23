import { useTranslation } from 'react-i18next'

import { useDeleteBodyParameters } from '@/api/queries/useDeleteBodyParameters'
import { Button } from '@/components/atoms/Button'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FormMessage } from '@/components/molecules/FormMessage'
import { getErrorMessage } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

type DeleteBodyParametersProps = {
  personId: string
  personName: string
}

export function DeleteBodyParameters({
  personId,
  personName,
}: DeleteBodyParametersProps) {
  const { t } = useTranslation('person')
  const [isConfirming, { open: openConfirmation, close: closeConfirmation }] =
    useOpen()
  const {
    mutate: deleteParameters,
    error,
    isPending,
  } = useDeleteBodyParameters(personId)

  const confirm = () => {
    closeConfirmation()
    deleteParameters()
  }

  return (
    <>
      {error ? <FormMessage message={getErrorMessage(error)} /> : null}
      <Button
        title={t('body-delete')}
        variant="secondary"
        isLoading={isPending}
        onPress={openConfirmation}
      />
      {isConfirming ? (
        <ConfirmDialog
          title={t('body-delete-title')}
          message={t('body-delete-message', { name: personName })}
          confirmLabel={t('body-delete-confirm')}
          cancelLabel={t('cancel')}
          confirmVariant="danger"
          onConfirm={confirm}
          onCancel={closeConfirmation}
        />
      ) : null}
    </>
  )
}
