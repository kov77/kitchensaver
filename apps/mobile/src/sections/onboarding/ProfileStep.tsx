import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button'
import { FormDateField } from '@/components/molecules/FormDateField'
import { FormTextField } from '@/components/molecules/FormTextField'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
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
  const { control, handleSubmit } = useForm<ProfileValues>({
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
      <FormTextField
        control={control}
        name="name"
        label={ONBOARDING_TEXT.nameLabel}
        autoCapitalize="words"
        autoComplete="given-name"
        placeholder={ONBOARDING_TEXT.namePlaceholder}
      />
      <FormDateField
        control={control}
        name="dateOfBirth"
        label={ONBOARDING_TEXT.dateOfBirthLabel}
        placeholder={ONBOARDING_TEXT.dateOfBirthPlaceholder}
        {...bounds}
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
