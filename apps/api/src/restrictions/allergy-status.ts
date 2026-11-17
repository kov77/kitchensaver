import { AllergyStatus, type Prisma } from '../generated/prisma/client.js'

type PersonProfileDelegate = Prisma.TransactionClient['personProfile']

export function markAsHavingAllergies(
  personProfile: PersonProfileDelegate,
  accountId: string,
  personId: string,
) {
  return personProfile.updateMany({
    where: {
      id: personId,
      accountId,
      OR: [
        { allergyStatus: null },
        { allergyStatus: { not: AllergyStatus.HAS_ALLERGIES } },
      ],
    },
    data: {
      allergyStatus: AllergyStatus.HAS_ALLERGIES,
      allergyStatusAt: new Date(),
    },
  })
}

export function resetAllergyStatus(
  personProfile: PersonProfileDelegate,
  accountId: string,
  personId: string,
) {
  return personProfile.updateMany({
    where: { id: personId, accountId },
    data: { allergyStatus: null, allergyStatusAt: null },
  })
}
