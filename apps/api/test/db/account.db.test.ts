import { describe, expect, it } from 'vitest'

import { Prisma } from '../../src/generated/prisma/client.js'
import { PrismaService } from '../../src/prisma/prisma.service.js'
import { createAccount, grantCurrentConsents } from '../support/factories.js'
import { createTestApp } from '../support/test-app.js'

async function setup() {
  const app = await createTestApp()
  return app.get(PrismaService)
}

describe('Account', () => {
  it('is stored with generated id, timestamps and no deletion mark', async () => {
    const prisma = await setup()

    const created = await createAccount(prisma)
    const found = await prisma.account.findUnique({
      where: { id: created.id },
    })

    expect(found).toEqual(created)
    expect(created.deletedAt).toBeNull()
    expect(created.createdAt).toBeInstanceOf(Date)
  })

  it('rejects a second account with the same auth subject', async () => {
    const prisma = await setup()
    const first = await createAccount(prisma)

    const duplicate = createAccount(prisma, {
      externalAuthSubject: first.externalAuthSubject,
    })

    await expect(duplicate).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    )
    await expect(duplicate).rejects.toMatchObject({ code: 'P2002' })
  })

  it('removes its profiles and consents together with it', async () => {
    const prisma = await setup()
    const account = await createAccount(prisma)
    await grantCurrentConsents(prisma, account.id)
    await prisma.personProfile.create({
      data: {
        accountId: account.id,
        name: 'Anna',
        dateOfBirth: new Date('1990-05-17T00:00:00Z'),
      },
    })

    await prisma.account.delete({ where: { id: account.id } })

    const where = { accountId: account.id }
    expect(await prisma.personProfile.count({ where })).toBe(0)
    expect(await prisma.accountConsent.count({ where })).toBe(0)
  })
})
