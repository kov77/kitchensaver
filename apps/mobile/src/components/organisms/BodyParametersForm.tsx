import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { FormMessage } from '@/components/molecules/FormMessage'
import type { BodyParameters } from '@/core/types'

import { BodyParametersFields } from './body/BodyParametersFields'
import { bodyParametersSchema, type BodyParametersValues } from './body/schemas'
import { toBodyParameters, toBodyParametersValues } from './body/utils'

type BodyParametersFormProps = {
  initialParameters: BodyParameters | null
  submitLabel: string
  isSubmitting: boolean
  errorMessage: string | null
  onSubmit: (parameters: BodyParameters) => void
}

export function BodyParametersForm({
  initialParameters,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: BodyParametersFormProps) {
  const form = useForm<BodyParametersValues>({
    resolver: zodResolver(bodyParametersSchema),
    defaultValues: toBodyParametersValues(initialParameters),
  })

  const submit = form.handleSubmit((values) => {
    const parameters = toBodyParameters(values)
    if (parameters) onSubmit(parameters)
  })

  return (
    <FormProvider {...form}>
      <BodyParametersFields />
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <Button
        title={submitLabel}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
    </FormProvider>
  )
}
