import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { ChoiceField } from '@/components/molecules/ChoiceField'
import { TextField } from '@/components/molecules/TextField'
import { GOAL_TYPE_LABELS } from '@/core/constants'
import type { GoalDraft } from '@/core/types'
import { parseDecimal } from '@/utils/numbers'

import { GOAL_EDITOR_TEXT, GOAL_TYPES } from './constants'
import { manualGoalSchema, type ManualGoalValues } from './schemas'

type ManualGoalFormProps = {
  submitLabel: string
  isSaving: boolean
  onSubmit: (goal: GoalDraft) => void
}

const GOAL_TYPE_OPTIONS = GOAL_TYPES.map((value) => ({
  value,
  label: GOAL_TYPE_LABELS[value],
}))

export function ManualGoalForm({
  submitLabel,
  isSaving,
  onSubmit,
}: ManualGoalFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualGoalValues>({
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
      <Controller
        control={control}
        name="goalType"
        render={({ field: { onChange, value } }) => (
          <ChoiceField
            label={GOAL_EDITOR_TEXT.goalTypeLabel}
            options={GOAL_TYPE_OPTIONS}
            value={value}
            onChange={onChange}
            errorMessage={errors.goalType?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="dailyKcal"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={GOAL_EDITOR_TEXT.kcalLabel}
            errorMessage={errors.dailyKcal?.message}
            keyboardType="number-pad"
            placeholder={GOAL_EDITOR_TEXT.kcalPlaceholder}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
          />
        )}
      />
      <Button
        title={submitLabel}
        isLoading={isSaving}
        onPress={() => void submit()}
      />
    </>
  )
}
