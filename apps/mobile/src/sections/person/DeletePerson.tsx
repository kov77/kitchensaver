import { Trans, useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { Highlight } from '@/components/atoms/Highlight'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FormMessage } from '@/components/molecules/FormMessage'
import { getErrorMessage } from '@/utils/errors'
import { useOpen } from '@/utils/useOpen'

type DeletePersonProps = {
  name: string
  isDeleting: boolean
  error: Error | null
  onDelete: () => void
}

export function DeletePerson({
  name,
  isDeleting,
  error,
  onDelete,
}: DeletePersonProps) {
  const { t } = useTranslation('person')
  const [isConfirming, { open: openConfirmation, close: closeConfirmation }] =
    useOpen()

  const confirm = () => {
    closeConfirmation()
    onDelete()
  }

  return (
    <>
      {error ? <FormMessage message={getErrorMessage(error)} /> : null}
      <Button
        title={t('delete-button')}
        variant="danger"
        isLoading={isDeleting}
        onPress={openConfirmation}
      />
      {isConfirming ? (
        <ConfirmDialog
          title={
            <Trans
              t={t}
              i18nKey="delete-title"
              values={{ name }}
              components={{ highlight: <Highlight /> }}
            />
          }
          message={t('delete-message')}
          confirmLabel={t('delete-confirm')}
          cancelLabel={t('cancel')}
          confirmVariant="danger"
          onConfirm={confirm}
          onCancel={closeConfirmation}
        />
      ) : null}
    </>
  )
}
