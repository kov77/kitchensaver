import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { FormDateField } from '@/components/molecules/FormDateField'
import { FormMessage } from '@/components/molecules/FormMessage'
import { FormTextField } from '@/components/molecules/FormTextField'
import { MAX_PROFILE_AGE, MIN_PROFILE_AGE } from '@/core/constants'
import { subtractYears } from '@/utils/dates'

import { createProfileSchema, type ProfileValues } from './profile/schemas'

type ProfileFormProps = {
  initialValues: ProfileValues
  submitLabel: string
  isSubmitting?: boolean
  errorMessage?: string | null
  onSubmit: (values: { name: string; dateOfBirth: Date }) => void
}

export function ProfileForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  errorMessage = null,
  onSubmit,
}: ProfileFormProps) {
  const { t } = useTranslation('profile')
  const bounds = useMemo(() => {
    const today = new Date()
    return {
      minimumDate: subtractYears(today, MAX_PROFILE_AGE),
      maximumDate: subtractYears(today, MIN_PROFILE_AGE),
    }
  }, [])
  const { control, handleSubmit } = useForm<ProfileValues>({
    resolver: zodResolver(createProfileSchema(bounds)),
    defaultValues: initialValues,
  })

  const submit = handleSubmit(({ name, dateOfBirth }) => {
    if (dateOfBirth) onSubmit({ name, dateOfBirth })
  })

  return (
    <>
      <FormTextField
        control={control}
        name="name"
        label={t('name-label')}
        autoCapitalize="words"
        autoComplete="given-name"
        placeholder={t('name-placeholder')}
      />
      <FormDateField
        control={control}
        name="dateOfBirth"
        label={t('date-of-birth-label')}
        placeholder={t('date-of-birth-placeholder')}
        {...bounds}
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
