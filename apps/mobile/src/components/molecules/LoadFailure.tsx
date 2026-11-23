import { Button } from '@/components/atoms/Button'
import { Text } from '@/components/atoms/Text'

type LoadFailureProps = {
  message: string
  retryLabel: string
  isRetrying: boolean
  onRetry: () => void
}

export function LoadFailure({
  message,
  retryLabel,
  isRetrying,
  onRetry,
}: LoadFailureProps) {
  return (
    <>
      <Text variant="body" color="warning">
        {message}
      </Text>
      <Button
        title={retryLabel}
        variant="secondary"
        isLoading={isRetrying}
        onPress={onRetry}
      />
    </>
  )
}
