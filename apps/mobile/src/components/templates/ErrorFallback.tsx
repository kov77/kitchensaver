import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'

import { AppScreen } from './AppScreen'

type ErrorFallbackProps = {
  onRetry: () => void
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation('common')
  return (
    <AppScreen>
      <ScreenHeader
        title={t('error-fallback-title')}
        subtitle={t('error-fallback-subtitle')}
      />
      <Button title={t('error-fallback-retry')} onPress={onRetry} />
    </AppScreen>
  )
}
