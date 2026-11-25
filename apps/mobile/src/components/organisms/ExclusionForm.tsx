import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'

import { exclusionSchema, type ExclusionValues } from './food/schemas'

type ExclusionFormProps = {
  submitLabel: string
  isSubmitting: boolean
  errorMessage: string | null
  onSubmit: (values: ExclusionValues) => void
}

export function ExclusionForm({
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: ExclusionFormProps) {
  const { t } = useTranslation('food')
  const { control, handleSubmit } = useForm<ExclusionValues>({
    resolver: zodResolver(exclusionSchema),
    defaultValues: { ingredientName: '' },
  })

  const submit = handleSubmit((values) => onSubmit(values))

  return (
    <>
      <FormTextField
        control={control}
        name="ingredientName"
        accessibilityLabel={t('name-label')}
        placeholder={t('name-placeholder')}
        autoCapitalize="none"
        autoFocus
      />
      {errorMessage ? <FormMessage message={errorMessage} /> : null}
      <Button
        title={submitLabel}
        isLoading={isSubmitting}
        onPress={() => void submit()}
      />
    </>
  )
}
