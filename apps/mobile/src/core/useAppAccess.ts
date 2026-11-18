import { useMe } from '@/api/queries/useMe'
import { getAppAccess } from '@/utils/appAccess'
import { getErrorMessage } from '@/utils/errors'

import { useSession } from './auth/SessionProvider'

export function useAppAccess() {
  const { state } = useSession()
  const {
    data: me,
    error,
    isFetching,
    isPending,
    refetch,
  } = useMe({
    skipGlobalError: true,
    enabled: state.status === 'signedIn',
  })

  return {
    access: getAppAccess({
      sessionStatus: state.status,
      isMeLoading: isPending,
      isConsentComplete: me?.onboarding.complete,
    }),
    errorMessage: getErrorMessage(error),
    isRetrying: isFetching,
    retry: () => void refetch(),
  }
}
