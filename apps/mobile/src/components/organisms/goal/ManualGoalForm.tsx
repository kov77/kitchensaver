import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormTextField } from '@/components/molecules/FormTextField'
import { GOAL_TYPE_LABEL_KEYS } from '@/core/constants'
import type { GoalDraft } from '@/core/types'
import { toOptions } from '@/utils/options'
import { parseDecimal } from '@/utils/numbers'

import { GOAL_TYPES } from './constants'
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
  const { t } = useTranslation(['goal', 'common'])
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
        label={t('editor-goal-type-label')}
        options={toOptions(GOAL_TYPES, (goalType) =>
          t(GOAL_TYPE_LABEL_KEYS[goalType]),
        )}
      />
      <FormTextField
        control={control}
        name="dailyKcal"
        label={t('editor-kcal-label')}
        keyboardType="number-pad"
        placeholder={t('editor-kcal-placeholder')}
      />
      <Button
        title={submitLabel}
        isLoading={isSaving}
        onPress={() => void submit()}
      />
    </>
  )
}
