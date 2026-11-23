import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { Spinner } from '@/components/atoms/Spinner'

import { LoadFailure } from './LoadFailure'

type QueryContentProps<Data> = {
  query: UseQueryResult<Data>
  failureMessage: string
  retryLabel: string
  children: (data: Data) => ReactNode
}

export function QueryContent<Data>({
  query,
  failureMessage,
  retryLabel,
  children,
}: QueryContentProps<Data>) {
  const { data, isError, isFetching, fetchStatus, refetch } = query

  if (data !== undefined && !isError) return <>{children(data)}</>

  if (isError || fetchStatus === 'paused') {
    return (
      <LoadFailure
        message={failureMessage}
        retryLabel={retryLabel}
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    )
  }

  return <Spinner />
}
