import { Injectable, UnauthorizedException } from '@nestjs/common'

import { hasPrismaCode } from '../common/prisma-errors.js'
import { PrismaService } from '../prisma/prisma.service.js'

const accountSelect = { id: true, deletedAt: true } as const

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAccountId(subject: string): Promise<string> {
    const account = await this.findOrCreateAccount(subject)
    if (account.deletedAt) throw new UnauthorizedException()
    return account.id
  }

  private async findOrCreateAccount(subject: string) {
    const where = { externalAuthSubject: subject }
    const existing = await this.prisma.account.findUnique({
      where,
      select: accountSelect,
    })
    if (existing) return existing

    try {
      return await this.prisma.account.create({
        data: where,
        select: accountSelect,
      })
    } catch (error) {
      if (!hasPrismaCode(error, 'P2002')) throw error
      return this.prisma.account.findUniqueOrThrow({
        where,
        select: accountSelect,
      })
    }
  }
}
