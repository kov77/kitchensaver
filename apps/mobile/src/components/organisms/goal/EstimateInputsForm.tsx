import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { GOAL_TYPE_LABEL_KEYS } from '@/core/constants'
import type { BodyParameters, EstimateInput } from '@/core/types'
import { toOptions } from '@/utils/options'

import { BodyParametersFields } from '../body/BodyParametersFields'
import { toBodyParameters, toBodyParametersValues } from '../body/utils'
import { ESTIMATED_GOAL_TYPES } from './constants'
import { estimateInputsSchema, type EstimateInputsValues } from './schemas'

type EstimateInputsFormProps = {
  initialInput: EstimateInput | null
  savedParameters: BodyParameters | null
  errorMessage: string | null
  isEstimating: boolean
  onSubmit: (input: EstimateInput) => void
}

export function EstimateInputsForm({
  initialInput,
  savedParameters,
  errorMessage,
  isEstimating,
  onSubmit,
}: EstimateInputsFormProps) {
  const { t } = useTranslation(['goal', 'common'])
  const form = useForm<EstimateInputsValues>({
    resolver: zodResolver(estimateInputsSchema),
    defaultValues: {
      goalType: initialInput?.goalType ?? null,
      ...toBodyParametersValues(initialInput ?? savedParameters),
    },
  })

  const submit = form.handleSubmit((values) => {
    const bodyParameters = toBodyParameters(values)
    if (bodyParameters === null || values.goalType === null) return
    onSubmit({ goalType: values.goalType, ...bodyParameters })
  })

  return (
    <FormProvider {...form}>
      <Text variant="body" color="textMuted">
        {t('editor-body-intro')}
      </Text>
      <FormChoiceField
        control={form.control}
        name="goalType"
        label={t('editor-goal-type-label')}
        options={toOptions(ESTIMATED_GOAL_TYPES, (goalType) =>
          t(GOAL_TYPE_LABEL_KEYS[goalType]),
        )}
      />
      <BodyParametersFields />
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <Button
        title={t('editor-calculate')}
        isLoading={isEstimating}
        onPress={() => void submit()}
      />
    </FormProvider>
  )
}
