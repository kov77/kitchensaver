import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'

import { WARNING_DIALOG_KEYS } from './constants'
import type { WarnedAnswer } from './types'

type AllergyWarningDialogProps = {
  answer: WarnedAnswer
  onConfirm: () => void
  onCancel: () => void
}

export function AllergyWarningDialog({
  answer,
  onConfirm,
  onCancel,
}: AllergyWarningDialogProps) {
  const { t } = useTranslation('allergy')
  const { titleKey, messageKey } = WARNING_DIALOG_KEYS[answer]

  return (
    <ConfirmDialog
      title={t(titleKey)}
      message={t(messageKey)}
      confirmLabel={t('warning-dialog-buttons-confirm')}
      cancelLabel={t('warning-dialog-buttons-cancel')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
