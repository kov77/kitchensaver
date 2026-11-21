import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { ProfileForm } from '@/components/organisms/ProfileForm'
import type { ProfileValues } from '@/components/organisms/profile/schemas'

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
  const { t } = useTranslation('onboarding')
  return (
    <>
      <ScreenHeader
        title={t('profile-title')}
        subtitle={t('profile-subtitle')}
      />
      <ProfileForm
        initialValues={initialValues}
        submitLabel={t('next')}
        onSubmit={onNext}
      />
      <Button title={t('log-out')} variant="secondary" onPress={onLogOut} />
    </>
  )
}
