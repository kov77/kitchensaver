import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { PersonSetupFlow } from './PersonSetupFlow'

export function AddPersonScreen() {
  const { t } = useTranslation('onboarding')
  const router = useRouter()

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'))

  return (
    <PersonSetupFlow
      title={t('add-person-title')}
      exitLabel={t('cancel')}
      onExit={leave}
      onCreated={leave}
    />
  )
}
