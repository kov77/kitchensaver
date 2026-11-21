import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'
import {
  ACTIVITY_LEVEL_LABEL_KEYS,
  GOAL_TYPE_LABEL_KEYS,
  SEX_LABEL_KEYS,
} from '@/core/constants'
import type { EstimateInput } from '@/core/types'
import { toOptions } from '@/utils/options'
import { parseDecimal } from '@/utils/numbers'

import {
  ACTIVITY_LEVELS,
  ESTIMATED_GOAL_TYPES,
  FORMULA_SEXES,
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
  const { t } = useTranslation(['goal', 'common'])
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
        {t('editor-body-intro')}
      </Text>
      <FormChoiceField
        control={control}
        name="goalType"
        label={t('editor-goal-type-label')}
        options={toOptions(ESTIMATED_GOAL_TYPES, (goalType) =>
          t(GOAL_TYPE_LABEL_KEYS[goalType]),
        )}
      />
      <FormTextField
        control={control}
        name="heightCm"
        label={t('editor-height-label')}
        keyboardType="decimal-pad"
      />
      <FormTextField
        control={control}
        name="weightKg"
        label={t('editor-weight-label')}
        keyboardType="decimal-pad"
      />
      <FormChoiceField
        control={control}
        name="activityLevel"
        label={t('editor-activity-label')}
        options={toOptions(ACTIVITY_LEVELS, (level) =>
          t(ACTIVITY_LEVEL_LABEL_KEYS[level]),
        )}
      />
      <FormChoiceField
        control={control}
        name="formulaSex"
        label={t('editor-sex-label')}
        options={toOptions(FORMULA_SEXES, (sex) => t(SEX_LABEL_KEYS[sex]))}
      />
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <Button
        title={t('editor-calculate')}
        isLoading={isEstimating}
        onPress={() => void submit()}
      />
    </>
  )
}
