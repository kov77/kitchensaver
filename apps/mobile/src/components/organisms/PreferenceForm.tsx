import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormStepperField } from '@/components/molecules/FormStepperField'
import { FormTextField } from '@/components/molecules/FormTextField'
import { DEFAULT_RATING, RATING_LIMITS } from '@/core/constants'
import type { Rating } from '@/core/types'
import { findRating } from '@/utils/ratings'

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
    defaultValues: { ingredientName: '', rating: DEFAULT_RATING },
  })

  const submit = handleSubmit(({ ingredientName, rating }) => {
    const validRating = findRating(rating)
    if (validRating === undefined) return
    onSubmit({ ingredientName, rating: validRating })
  })

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
      <FormStepperField
        control={control}
        name="rating"
        label={t('rating-label')}
        min={RATING_LIMITS.min}
        max={RATING_LIMITS.max}
        decreaseLabel={t('rating-lower')}
        increaseLabel={t('rating-higher')}
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
