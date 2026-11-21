import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'

import { AppScreen } from './AppScreen'

type AccountUnavailableProps = {
  message: string
  isRetrying: boolean
  onRetry: () => void
  onLogOut: () => void
}

export function AccountUnavailable({
  message,
  isRetrying,
  onRetry,
  onLogOut,
}: AccountUnavailableProps) {
  const { t } = useTranslation('common')
  return (
    <AppScreen>
      <ScreenHeader title={t('account-unavailable-title')} />
      <FormMessage message={message} />
      <Button
        title={t('account-unavailable-retry')}
        isLoading={isRetrying}
        onPress={onRetry}
      />
      <Button
        title={t('account-unavailable-log-out')}
        variant="secondary"
        onPress={onLogOut}
      />
    </AppScreen>
  )
}
