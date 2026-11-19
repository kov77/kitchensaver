import { useMe } from '@/api/queries/useMe'
import { usePeople } from '@/api/queries/usePeople'
import { getAppAccess } from '@/utils/appAccess'
import { getErrorMessage } from '@/utils/errors'

import { useSession } from './auth/SessionProvider'

export function useAppAccess() {
  const { state } = useSession()
  const me = useMe({
    skipGlobalError: true,
    enabled: state.status === 'signedIn',
  })
  const isConsentComplete = me.data?.onboarding.complete
  const people = usePeople({
    status: 'all',
    enabled: isConsentComplete === true,
  })

  const isPeopleLoading = isConsentComplete === true && people.isPending
  const failedQuery = me.data ? people : me

  return {
    access: getAppAccess({
      sessionStatus: state.status,
      isMeLoading: me.isPending,
      isConsentComplete,
      isPeopleLoading,
      hasProfile: people.data ? people.data.length > 0 : undefined,
    }),
    errorMessage: getErrorMessage(failedQuery.error),
    isRetrying: failedQuery.isFetching,
    retry: () => void failedQuery.refetch(),
  }
}
