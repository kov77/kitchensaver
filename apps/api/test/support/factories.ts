import { randomUUID } from 'node:crypto'

import type { Prisma } from '../../src/generated/prisma/client.js'
import type { PrismaService } from '../../src/prisma/prisma.service.js'

export async function createAccount(
  prisma: PrismaService,
  overrides: Partial<Prisma.AccountCreateInput> = {},
) {
  return prisma.account.create({
    data: { externalAuthSubject: `test-${randomUUID()}`, ...overrides },
  })
}
