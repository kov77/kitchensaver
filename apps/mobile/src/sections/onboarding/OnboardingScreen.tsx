import { useTranslation } from 'react-i18next'

import { useSession } from '@/core/auth/SessionProvider'

import { PersonSetupFlow } from './PersonSetupFlow'

export function OnboardingScreen() {
  const { t } = useTranslation('onboarding')
  const { signOut } = useSession()

  return (
    <PersonSetupFlow
      title={t('profile-title')}
      exitLabel={t('log-out')}
      onExit={() => void signOut()}
    />
  )
}
