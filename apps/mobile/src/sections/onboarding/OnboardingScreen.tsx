import { useState } from 'react'

import { useCreateOnboarding } from '@/api/queries/useCreateOnboarding'
import { AppScreen } from '@/components/templates/AppScreen'
import { useSession } from '@/core/auth/SessionProvider'
import { getErrorMessage } from '@/utils/errors'

import { AllergyStep } from './AllergyStep'
import { ProfileStep } from './ProfileStep'
import type { AllergyValues, ProfileValues } from './schemas'
import { buildOnboardingBody } from './utils'
import { useAttemptKey } from './useAttemptKey'

type Profile = { name: string; dateOfBirth: Date }

const EMPTY_PROFILE: ProfileValues = { name: '', dateOfBirth: null }

export function OnboardingScreen() {
  const { signOut } = useSession()
  const { mutate: createOnboarding, error, isPending } = useCreateOnboarding()
  const getAttemptKey = useAttemptKey()
  const [profile, setProfile] = useState<Profile | null>(null)

  const submit = (allergies: AllergyValues) => {
    if (!profile) return
    const body = buildOnboardingBody(profile, allergies)
    createOnboarding({
      body,
      idempotencyKey: getAttemptKey(JSON.stringify(body)),
    })
  }

  return (
    <AppScreen>
      {profile ? (
        <AllergyStep
          errorMessage={error ? getErrorMessage(error) : null}
          isSubmitting={isPending}
          onBack={() => setProfile(null)}
          onSubmit={submit}
        />
      ) : (
        <ProfileStep
          initialValues={EMPTY_PROFILE}
          onNext={setProfile}
          onLogOut={() => void signOut()}
        />
      )}
    </AppScreen>
  )
}
