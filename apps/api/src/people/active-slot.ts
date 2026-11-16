import { ApiException } from '../common/api-exception.js'
import type { Prisma } from '../generated/prisma/client.js'

export async function assertActiveSlotAvailable(
  { personProfile }: Prisma.TransactionClient,
  accountId: string,
  activeProfilesLimit: number,
) {
  const activeCount = await personProfile.count({
    where: { accountId, archivedAt: null },
  })
  if (activeCount < activeProfilesLimit) return
  throw new ApiException(
    409,
    'PROFILE_LIMIT_REACHED',
    'The limit of active profiles is reached',
    { limit: activeProfilesLimit },
  )
}
