import { useState } from 'react'

import { useCreateOnboarding } from '@/api/queries/useCreateOnboarding'
import { AppScreen } from '@/components/templates/AppScreen'
import { useSession } from '@/core/auth/SessionProvider'
import type { GoalDraft } from '@/core/types'
import { getErrorMessage } from '@/utils/errors'

import { AllergyStep } from './AllergyStep'
import { GoalStep } from './GoalStep'
import { ProfileStep } from './ProfileStep'
import type { AllergyValues, ProfileValues } from './schemas'
import { buildOnboardingBody } from './utils'
import { useAttemptKey } from './useAttemptKey'

type Profile = { name: string; dateOfBirth: Date }

type Step = 'profile' | 'goal' | 'allergies'

const EMPTY_PROFILE: ProfileValues = { name: '', dateOfBirth: null }

export function OnboardingScreen() {
  const { signOut } = useSession()
  const { mutate: createOnboarding, error, isPending } = useCreateOnboarding()
  const getAttemptKey = useAttemptKey()
  const [step, setStep] = useState<Step>('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goal, setGoal] = useState<GoalDraft | null>(null)

  const submit = (allergies: AllergyValues) => {
    if (!profile) return
    const body = buildOnboardingBody(profile, goal, allergies)
    createOnboarding({
      body,
      idempotencyKey: getAttemptKey(JSON.stringify(body)),
    })
  }

  return (
    <AppScreen>
      {step === 'profile' || !profile ? (
        <ProfileStep
          initialValues={profile ?? EMPTY_PROFILE}
          onNext={(values) => {
            setProfile(values)
            setStep('goal')
          }}
          onLogOut={() => void signOut()}
        />
      ) : null}
      {step === 'goal' && profile ? (
        <GoalStep
          dateOfBirth={profile.dateOfBirth}
          onNext={(draft) => {
            setGoal(draft)
            setStep('allergies')
          }}
          onBack={() => setStep('profile')}
        />
      ) : null}
      {step === 'allergies' && profile ? (
        <AllergyStep
          errorMessage={error ? getErrorMessage(error) : null}
          isSubmitting={isPending}
          onBack={() => setStep('goal')}
          onSubmit={submit}
        />
      ) : null}
    </AppScreen>
  )
}
