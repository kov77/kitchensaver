import request from 'supertest'
import { describe, expect, onTestFinished, test, vi } from 'vitest'

import { AuthService } from '../../src/auth/auth.service.js'
import { PrismaService } from '../../src/prisma/prisma.service.js'
import { createAccount } from '../support/factories.js'
import { createTestApp } from '../support/test-app.js'
import { createActor, signTestToken } from '../support/test-auth.js'

describe('GET /api/v1/me', () => {
  test('creates the account on the first request and returns its id', async () => {
    const app = await createTestApp()
    const prisma = app.get(PrismaService)
    const user = await createActor()

    const response = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', user.authorization)

    expect(response.status).toBe(200)
    const stored = await prisma.account.findUnique({
      where: { externalAuthSubject: user.subject },
    })
    expect(stored?.id).toBe(response.body.id)
  })

  test('returns the same account on repeated requests', async () => {
    const app = await createTestApp()
    const user = await createActor()

    const first = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', user.authorization)
    const second = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', user.authorization)

    expect(second.body.id).toBe(first.body.id)
  })

  test('gives different users different accounts', async () => {
    const app = await createTestApp()
    const user = await createActor()
    const otherUser = await createActor()

    const userResponse = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', user.authorization)
    const otherResponse = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', otherUser.authorization)

    expect(userResponse.body.id).not.toBe(otherResponse.body.id)
  })

  test('creates a single account for concurrent first requests', async () => {
    const app = await createTestApp()
    const prisma = app.get(PrismaService)
    const user = await createActor()

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .get('/api/v1/me')
          .set('Authorization', user.authorization),
      ),
    )

    expect(responses.map(({ status }) => status)).toEqual(Array(5).fill(200))
    expect(new Set(responses.map(({ body }) => body.id)).size).toBe(1)
    expect(
      await prisma.account.count({
        where: { externalAuthSubject: user.subject },
      }),
    ).toBe(1)
  })

  test('falls back to the existing account when creation loses a race', async () => {
    const app = await createTestApp()
    const prisma = app.get(PrismaService)
    const authService = app.get(AuthService, { strict: false })
    const existing = await createAccount(prisma)
    vi.spyOn(prisma.account, 'findUnique').mockResolvedValueOnce(null)
    onTestFinished(() => {
      vi.restoreAllMocks()
    })

    await expect(
      authService.resolveAccountId(existing.externalAuthSubject),
    ).resolves.toBe(existing.id)
  })

  test('does not hide other failures of account creation', async () => {
    const app = await createTestApp()
    const prisma = app.get(PrismaService)
    const authService = app.get(AuthService, { strict: false })
    vi.spyOn(prisma.account, 'findUnique').mockResolvedValueOnce(null)
    vi.spyOn(prisma.account, 'create').mockRejectedValueOnce(
      new Error('database down'),
    )
    onTestFinished(() => {
      vi.restoreAllMocks()
    })

    await expect(authService.resolveAccountId('any-subject')).rejects.toThrow(
      'database down',
    )
  })

  test('rejects a user whose account was deleted', async () => {
    const app = await createTestApp()
    const prisma = app.get(PrismaService)
    const subject = `deleted-${crypto.randomUUID()}`
    await createAccount(prisma, {
      externalAuthSubject: subject,
      deletedAt: new Date(),
    })
    const token = await signTestToken({ subject })

    const response = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(401)
  })
})
