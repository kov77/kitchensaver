import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { AllergyAnswerForm } from '@/components/organisms/AllergyAnswerForm'
import type { AllergyAnswerValues } from '@/components/organisms/allergy/schemas'

type AllergyStepProps = {
  errorMessage: string | null
  isSubmitting: boolean
  onBack: () => void
  onSubmit: (values: AllergyAnswerValues) => void
}

export function AllergyStep({
  errorMessage,
  isSubmitting,
  onBack,
  onSubmit,
}: AllergyStepProps) {
  const { t } = useTranslation('onboarding')

  return (
    <>
      <ScreenHeader title={t('allergy-title')} />
      <AllergyAnswerForm
        submitLabel={t('finish')}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
      />
      <Button title={t('back')} variant="secondary" onPress={onBack} />
    </>
  )
}
