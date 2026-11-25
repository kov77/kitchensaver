import { useTranslation } from 'react-i18next'

import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { ProfileForm } from '@/components/organisms/ProfileForm'
import type { ProfileValues } from '@/components/organisms/profile/schemas'

type ProfileStepProps = {
  title: string
  initialValues: ProfileValues
  exitLabel: string
  onNext: (values: { name: string; dateOfBirth: Date }) => void
  onExit: () => void
}

export function ProfileStep({
  title,
  initialValues,
  exitLabel,
  onNext,
  onExit,
}: ProfileStepProps) {
  const { t } = useTranslation('onboarding')

  return (
    <>
      <ScreenHeader title={title} subtitle={t('profile-subtitle')} />
      <ProfileForm
        initialValues={initialValues}
        submitLabel={t('next')}
        onSubmit={onNext}
      />
      <Button title={exitLabel} variant="secondary" onPress={onExit} />
    </>
  )
}
