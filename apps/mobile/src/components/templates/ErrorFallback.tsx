import { Button } from '@/components/atoms/Button'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'

import { AppScreen } from './AppScreen'
import { ERROR_FALLBACK_TEXT } from './constants'

type ErrorFallbackProps = {
  onRetry: () => void
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  return (
    <AppScreen>
      <ScreenHeader
        title={ERROR_FALLBACK_TEXT.title}
        subtitle={ERROR_FALLBACK_TEXT.subtitle}
      />
      <Button title={ERROR_FALLBACK_TEXT.retry} onPress={onRetry} />
    </AppScreen>
  )
}
