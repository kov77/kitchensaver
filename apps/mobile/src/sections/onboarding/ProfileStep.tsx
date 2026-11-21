import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'
import { ProfileForm } from '@/components/organisms/ProfileForm'
import type { ProfileValues } from '@/components/organisms/profile/schemas'

import { ONBOARDING_TEXT } from './constants'

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
  return (
    <>
      <ScreenHeader
        title={ONBOARDING_TEXT.profileTitle}
        subtitle={ONBOARDING_TEXT.profileSubtitle}
      />
      <ProfileForm
        initialValues={initialValues}
        submitLabel={ONBOARDING_TEXT.next}
        onSubmit={onNext}
      />
      <Button
        title={ONBOARDING_TEXT.logOut}
        variant="secondary"
        onPress={onLogOut}
      />
    </>
  )
}
