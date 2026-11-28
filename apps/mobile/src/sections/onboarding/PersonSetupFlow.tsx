import { useReducer } from 'react'

import { useCreateOnboarding } from '@/api/queries/useCreateOnboarding'
import type { OnboardingBody } from '@/api/types'
import type { AllergyAnswerValues } from '@/components/organisms/allergy/schemas'
import { KcalWarningDialog } from '@/components/organisms/goal/KcalWarningDialog'
import { EMPTY_PROFILE } from '@/components/organisms/profile/constants'
import { AppScreen } from '@/components/templates/AppScreen'
import { getErrorMessage, isKcalWarningError } from '@/utils/errors'

import { AllergyStep } from './AllergyStep'
import { INITIAL_FLOW_STATE } from './constants'
import { GoalStep } from './GoalStep'
import { ProfileStep } from './ProfileStep'
import { buildOnboardingBody, onboardingFlowReducer } from './utils'
import { useAttemptKey } from './useAttemptKey'

type PersonSetupFlowProps = {
  title: string
  exitLabel: string
  onExit: () => void
  onCreated?: () => void
}

export function PersonSetupFlow({
  title,
  exitLabel,
  onExit,
  onCreated,
}: PersonSetupFlowProps) {
  const {
    mutate: createOnboarding,
    error,
    isPending,
    variables: attempt,
    reset: resetAttempt,
  } = useCreateOnboarding()
  const getAttemptKey = useAttemptKey()
  const [flow, dispatch] = useReducer(onboardingFlowReducer, INITIAL_FLOW_STATE)

  const send = (body: OnboardingBody) =>
    createOnboarding(
      { body, idempotencyKey: getAttemptKey(JSON.stringify(body)) },
      { onSuccess: onCreated },
    )

  const submit = (allergies: AllergyAnswerValues) => {
    if (flow.step !== 'allergies') return
    send(buildOnboardingBody(flow.profile, flow.goal, allergies))
  }

  const confirmKcalWarning = () => {
    const goal = attempt?.body.goal
    if (!attempt || !goal) return
    send({ ...attempt.body, goal: { ...goal, confirmKcalWarning: true } })
  }

  const isKcalConfirmationNeeded = isKcalWarningError(error)

  return (
    <AppScreen>
      {flow.step === 'profile' ? (
        <ProfileStep
          title={title}
          initialValues={flow.profile ?? EMPTY_PROFILE}
          exitLabel={exitLabel}
          onNext={(profile) => dispatch({ type: 'profileSubmitted', profile })}
          onExit={onExit}
        />
      ) : null}
      {flow.step === 'goal' ? (
        <GoalStep
          dateOfBirth={flow.profile.dateOfBirth}
          onNext={(goal) => dispatch({ type: 'goalChosen', goal })}
          onBack={() => dispatch({ type: 'back' })}
        />
      ) : null}
      {flow.step === 'allergies' ? (
        <AllergyStep
          errorMessage={
            error && !isKcalConfirmationNeeded ? getErrorMessage(error) : null
          }
          isSubmitting={isPending}
          onBack={() => dispatch({ type: 'back' })}
          onSubmit={submit}
        />
      ) : null}
      {isKcalConfirmationNeeded ? (
        <KcalWarningDialog
          onConfirm={confirmKcalWarning}
          onCancel={resetAttempt}
        />
      ) : null}
    </AppScreen>
  )
}
