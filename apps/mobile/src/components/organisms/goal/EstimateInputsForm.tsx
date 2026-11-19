import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { ChoiceField } from '@/components/molecules/ChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { TextField } from '@/components/molecules/TextField'
import { GOAL_TYPE_LABELS } from '@/core/constants'
import type { EstimateInput } from '@/core/types'
import { parseDecimal } from '@/utils/numbers'

import {
  ACTIVITY_LABELS,
  ESTIMATED_GOAL_TYPES,
  GOAL_EDITOR_TEXT,
  SEX_LABELS,
} from './constants'
import { estimateInputsSchema, type EstimateInputsValues } from './schemas'

type EstimateInputsFormProps = {
  initialInput: EstimateInput | null
  errorMessage: string | null
  isEstimating: boolean
  onSubmit: (input: EstimateInput) => void
}

const GOAL_TYPE_OPTIONS = ESTIMATED_GOAL_TYPES.map((value) => ({
  value,
  label: GOAL_TYPE_LABELS[value],
}))

const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_LABELS).map(
  ([value, label]) => ({
    value: value as keyof typeof ACTIVITY_LABELS,
    label,
  }),
)

const SEX_OPTIONS = Object.entries(SEX_LABELS).map(([value, label]) => ({
  value: value as keyof typeof SEX_LABELS,
  label,
}))

export function EstimateInputsForm({
  initialInput,
  errorMessage,
  isEstimating,
  onSubmit,
}: EstimateInputsFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EstimateInputsValues>({
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
        name="heightCm"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={GOAL_EDITOR_TEXT.heightLabel}
            errorMessage={errors.heightCm?.message}
            keyboardType="decimal-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="weightKg"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={GOAL_EDITOR_TEXT.weightLabel}
            errorMessage={errors.weightKg?.message}
            keyboardType="decimal-pad"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="activityLevel"
        render={({ field: { onChange, value } }) => (
          <ChoiceField
            label={GOAL_EDITOR_TEXT.activityLabel}
            options={ACTIVITY_OPTIONS}
            value={value}
            onChange={onChange}
            errorMessage={errors.activityLevel?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="formulaSex"
        render={({ field: { onChange, value } }) => (
          <ChoiceField
            label={GOAL_EDITOR_TEXT.sexLabel}
            options={SEX_OPTIONS}
            value={value}
            onChange={onChange}
            errorMessage={errors.formulaSex?.message}
          />
        )}
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
