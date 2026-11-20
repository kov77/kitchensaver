import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormTextField } from '@/components/molecules/FormTextField'
import type { GoalDraft } from '@/core/types'
import { parseDecimal } from '@/utils/numbers'

import { GOAL_EDITOR_TEXT, GOAL_TYPE_OPTIONS } from './constants'
import { manualGoalSchema, type ManualGoalValues } from './schemas'

type ManualGoalFormProps = {
  submitLabel: string
  isSaving: boolean
  onSubmit: (goal: GoalDraft) => void
}

export function ManualGoalForm({
  submitLabel,
  isSaving,
  onSubmit,
}: ManualGoalFormProps) {
  const { control, handleSubmit } = useForm<ManualGoalValues>({
    resolver: zodResolver(manualGoalSchema),
    defaultValues: { goalType: null, dailyKcal: '' },
  })

  const submit = handleSubmit(({ goalType, dailyKcal }) => {
    const kcal = parseDecimal(dailyKcal)
    if (goalType === null || kcal === null) return
    onSubmit({ mode: 'MANUAL', goalType, dailyKcal: kcal })
  })

  return (
    <>
      <FormChoiceField
        control={control}
        name="goalType"
        label={GOAL_EDITOR_TEXT.goalTypeLabel}
        options={GOAL_TYPE_OPTIONS}
      />
      <FormTextField
        control={control}
        name="dailyKcal"
        label={GOAL_EDITOR_TEXT.kcalLabel}
        keyboardType="number-pad"
        placeholder={GOAL_EDITOR_TEXT.kcalPlaceholder}
      />
      <Button
        title={submitLabel}
        isLoading={isSaving}
        onPress={() => void submit()}
      />
    </>
  )
}
