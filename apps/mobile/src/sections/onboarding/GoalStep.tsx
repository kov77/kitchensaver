import { useTranslation } from 'react-i18next'
import { requestGoalPreview } from '@/api/goalRequests'
import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { GoalEditor } from '@/components/organisms/GoalEditor'
import type { EstimateInput, GoalDraft } from '@/core/types'
import { toIsoDate } from '@/utils/dates'

type GoalStepProps = {
  dateOfBirth: Date
  onNext: (goal: GoalDraft | null) => void
  onBack: () => void
}

export function GoalStep({ dateOfBirth, onNext, onBack }: GoalStepProps) {
  const { t } = useTranslation('onboarding')
  const estimate = (input: EstimateInput) =>
    requestGoalPreview(toIsoDate(dateOfBirth), input)

  return (
    <>
      <ScreenHeader title={t('goal-title')} subtitle={t('goal-subtitle')} />
      <GoalEditor
        submitLabel={t('next')}
        isSaving={false}
        saveErrorMessage={null}
        onEstimate={estimate}
        onSave={onNext}
      />
      <Button
        title={t('skip')}
        variant="secondary"
        onPress={() => onNext(null)}
      />
      <Button title={t('back')} variant="secondary" onPress={onBack} />
    </>
  )
}
