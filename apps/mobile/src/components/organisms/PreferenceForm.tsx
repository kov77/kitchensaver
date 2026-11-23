import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { FormChoiceField } from '@/components/molecules/FormChoiceField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'
import { RATINGS } from '@/core/constants'
import type { Rating } from '@/core/types'
import { toOptions } from '@/utils/options'

import { RATING_CHOICES } from './food/constants'
import { preferenceSchema, type PreferenceValues } from './food/schemas'

type PreferenceFormProps = {
  submitLabel: string
  isSubmitting: boolean
  errorMessage: string | null
  onSubmit: (preference: { ingredientName: string; rating: Rating }) => void
}

export function PreferenceForm({
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: PreferenceFormProps) {
  const { t } = useTranslation('food')
  const { control, handleSubmit } = useForm<PreferenceValues>({
    resolver: zodResolver(preferenceSchema),
    defaultValues: { ingredientName: '', rating: null },
  })

  const submit = handleSubmit(({ ingredientName, rating }) => {
    const chosenRating = RATINGS.find((option) => String(option) === rating)
    if (chosenRating === undefined) return
    onSubmit({ ingredientName, rating: chosenRating })
  })

  return (
    <>
      <FormTextField
        control={control}
        name="ingredientName"
        label={t('name-label')}
        placeholder={t('name-placeholder')}
        autoCapitalize="none"
      />
      <FormChoiceField
        control={control}
        name="rating"
        label={t('rating-label')}
        options={toOptions(RATING_CHOICES, (value) => value)}
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
