import { randomUUID } from 'node:crypto'

import type { Prisma } from '../../src/generated/prisma/client.js'
import {
  CONSENT_CATEGORIES,
  CURRENT_LEGAL_VERSIONS,
} from '../../src/consent/legal-versions.js'
import type { PrismaService } from '../../src/prisma/prisma.service.js'
import { signTestToken } from './test-auth.js'

export async function createAccount(
  prisma: PrismaService,
  overrides: Partial<Prisma.AccountCreateInput> = {},
) {
  return prisma.account.create({
    data: { externalAuthSubject: `test-${randomUUID()}`, ...overrides },
  })
}

export async function grantCurrentConsents(
  prisma: PrismaService,
  accountId: string,
) {
  await prisma.accountConsent.createMany({
    data: CONSENT_CATEGORIES.map((category) => ({
      accountId,
      category,
      documentVersion: CURRENT_LEGAL_VERSIONS[category],
    })),
  })
}

export async function createConsentedActor(prisma: PrismaService) {
  const account = await createAccount(prisma)
  await grantCurrentConsents(prisma, account.id)
  const token = await signTestToken({ subject: account.externalAuthSubject })
  return { accountId: account.id, authorization: `Bearer ${token}` }
}
