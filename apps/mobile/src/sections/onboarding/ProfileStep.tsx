import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { DateField } from '@/components/molecules/DateField'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { TextField } from '@/components/molecules/TextField'
import { MAX_PROFILE_AGE, MIN_PROFILE_AGE } from '@/core/constants'
import { subtractYears } from '@/utils/dates'

import { ONBOARDING_TEXT } from './constants'
import { createProfileSchema, type ProfileValues } from './schemas'

type ProfileStepProps = {
  initialValues: ProfileValues
  onNext: (values: { name: string; dateOfBirth: Date }) => void
  onLogOut: () => void
}

export function ProfileStep({
  initialValues,
  onNext,
  onLogOut,
}: ProfileStepProps) {
  const bounds = useMemo(() => {
    const today = new Date()
    return {
      minimumDate: subtractYears(today, MAX_PROFILE_AGE),
      maximumDate: subtractYears(today, MIN_PROFILE_AGE),
    }
  }, [])
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(createProfileSchema(bounds)),
    defaultValues: initialValues,
  })

  const submit = handleSubmit(({ name, dateOfBirth }) => {
    if (dateOfBirth) onNext({ name, dateOfBirth })
  })

  return (
    <>
      <ScreenHeader
        title={ONBOARDING_TEXT.profileTitle}
        subtitle={ONBOARDING_TEXT.profileSubtitle}
      />
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={ONBOARDING_TEXT.nameLabel}
            errorMessage={errors.name?.message}
            autoCapitalize="words"
            autoComplete="given-name"
            placeholder={ONBOARDING_TEXT.namePlaceholder}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field: { onChange, value } }) => (
          <DateField
            label={ONBOARDING_TEXT.dateOfBirthLabel}
            placeholder={ONBOARDING_TEXT.dateOfBirthPlaceholder}
            errorMessage={errors.dateOfBirth?.message}
            value={value}
            onChange={onChange}
            {...bounds}
          />
        )}
      />
      <Button title={ONBOARDING_TEXT.next} onPress={() => void submit()} />
      <Button
        title={ONBOARDING_TEXT.logOut}
        variant="secondary"
        onPress={onLogOut}
      />
    </>
  )
}
