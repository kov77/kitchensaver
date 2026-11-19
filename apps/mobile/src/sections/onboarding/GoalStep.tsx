import { requestGoalPreview } from '@/api/goalRequests'
import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { GoalEditor } from '@/components/organisms/GoalEditor'
import type { EstimateInput, GoalDraft } from '@/core/types'
import { toIsoDate } from '@/utils/dates'

import { ONBOARDING_TEXT } from './constants'

type GoalStepProps = {
  dateOfBirth: Date
  onNext: (goal: GoalDraft | null) => void
  onBack: () => void
}

export function GoalStep({ dateOfBirth, onNext, onBack }: GoalStepProps) {
  const estimate = (input: EstimateInput) =>
    requestGoalPreview(toIsoDate(dateOfBirth), input)

  return (
    <>
      <ScreenHeader
        title={ONBOARDING_TEXT.goalTitle}
        subtitle={ONBOARDING_TEXT.goalSubtitle}
      />
      <GoalEditor
        submitLabel={ONBOARDING_TEXT.next}
        isSaving={false}
        saveErrorMessage={null}
        onEstimate={estimate}
        onSave={onNext}
      />
      <Button
        title={ONBOARDING_TEXT.skip}
        variant="secondary"
        onPress={() => onNext(null)}
      />
      <Button
        title={ONBOARDING_TEXT.back}
        variant="secondary"
        onPress={onBack}
      />
    </>
  )
}
