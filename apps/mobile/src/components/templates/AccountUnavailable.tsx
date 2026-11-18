import { Button } from '@/components/atoms/Button'
import { FormMessage } from '@/components/molecules/FormMessage'
import { ScreenHeader } from '@/components/molecules/ScreenHeader'

import { AppScreen } from './AppScreen'
import { ACCOUNT_UNAVAILABLE_TEXT } from './constants'

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
  return (
    <AppScreen>
      <ScreenHeader title={ACCOUNT_UNAVAILABLE_TEXT.title} />
      <FormMessage message={message} />
      <Button
        title={ACCOUNT_UNAVAILABLE_TEXT.retry}
        isLoading={isRetrying}
        onPress={onRetry}
      />
      <Button
        title={ACCOUNT_UNAVAILABLE_TEXT.logOut}
        variant="secondary"
        onPress={onLogOut}
      />
    </AppScreen>
  )
}
