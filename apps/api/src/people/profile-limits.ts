import { ApiException } from '../common/api-exception.js'
import type { AccountLimits } from '../entitlements/entitlements.service.js'
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

async function assertTotalProfilesBelowLimit(
  { personProfile }: Prisma.TransactionClient,
  accountId: string,
  totalProfilesLimit: number,
) {
  const totalCount = await personProfile.count({ where: { accountId } })
  if (totalCount < totalProfilesLimit) return
  throw new ApiException(
    409,
    'PROFILE_TOTAL_LIMIT_REACHED',
    'The account holds the maximum number of profiles; delete an archived profile first',
    { limit: totalProfilesLimit },
  )
}

export async function assertCanCreateProfile(
  tx: Prisma.TransactionClient,
  accountId: string,
  { activeProfiles, totalProfiles }: AccountLimits,
) {
  await assertActiveSlotAvailable(tx, accountId, activeProfiles)
  await assertTotalProfilesBelowLimit(tx, accountId, totalProfiles)
}
