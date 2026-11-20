import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'
import type { EstimateInput } from '@/core/types'
import { parseDecimal } from '@/utils/numbers'

import {
  ACTIVITY_OPTIONS,
  ESTIMATED_GOAL_TYPE_OPTIONS,
  GOAL_EDITOR_TEXT,
  SEX_OPTIONS,
} from './constants'
import { estimateInputsSchema, type EstimateInputsValues } from './schemas'

type EstimateInputsFormProps = {
  initialInput: EstimateInput | null
  errorMessage: string | null
  isEstimating: boolean
  onSubmit: (input: EstimateInput) => void
}

export function EstimateInputsForm({
  initialInput,
  errorMessage,
  isEstimating,
  onSubmit,
}: EstimateInputsFormProps) {
  const { control, handleSubmit } = useForm<EstimateInputsValues>({
    resolver: zodResolver(estimateInputsSchema),
    defaultValues: initialInput
      ? {
          ...initialInput,
          heightCm: String(initialInput.heightCm),
          weightKg: String(initialInput.weightKg),
        }
      : {
          goalType: null,
          heightCm: '',
          weightKg: '',
          activityLevel: null,
          formulaSex: null,
        },
  })

  const submit = handleSubmit((values) => {
    const heightCm = parseDecimal(values.heightCm)
    const weightKg = parseDecimal(values.weightKg)
    const { goalType, activityLevel, formulaSex } = values
    if (
      heightCm === null ||
      weightKg === null ||
      goalType === null ||
      activityLevel === null ||
      formulaSex === null
    ) {
      return
    }
    onSubmit({ goalType, heightCm, weightKg, activityLevel, formulaSex })
  })

  return (
    <>
      <Text variant="body" color="textMuted">
        {GOAL_EDITOR_TEXT.bodyIntro}
      </Text>
      <FormChoiceField
        control={control}
        name="goalType"
        label={GOAL_EDITOR_TEXT.goalTypeLabel}
        options={ESTIMATED_GOAL_TYPE_OPTIONS}
      />
      <FormTextField
        control={control}
        name="heightCm"
        label={GOAL_EDITOR_TEXT.heightLabel}
        keyboardType="decimal-pad"
      />
      <FormTextField
        control={control}
        name="weightKg"
        label={GOAL_EDITOR_TEXT.weightLabel}
        keyboardType="decimal-pad"
      />
      <FormChoiceField
        control={control}
        name="activityLevel"
        label={GOAL_EDITOR_TEXT.activityLabel}
        options={ACTIVITY_OPTIONS}
      />
      <FormChoiceField
        control={control}
        name="formulaSex"
        label={GOAL_EDITOR_TEXT.sexLabel}
        options={SEX_OPTIONS}
      />
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <Button
        title={GOAL_EDITOR_TEXT.calculate}
        isLoading={isEstimating}
        onPress={() => void submit()}
      />
    </>
  )
}
