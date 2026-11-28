import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'

type KcalWarningDialogProps = {
  onConfirm: () => void
  onCancel: () => void
}

export function KcalWarningDialog({
  onConfirm,
  onCancel,
}: KcalWarningDialogProps) {
  const { t } = useTranslation('goal')

  return (
    <ConfirmDialog
      title={t('kcal-warning-title')}
      message={t('kcal-warning-message')}
      confirmLabel={t('kcal-warning-confirm')}
      cancelLabel={t('kcal-warning-cancel')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
