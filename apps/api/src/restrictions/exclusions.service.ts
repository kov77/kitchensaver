import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { hasPrismaCode } from '../common/prisma-errors.js'
import { PeopleService } from '../people/people.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { normalizeName } from './normalize-name.js'
import type { AddExclusionRequest } from './restrictions.dto.js'
import { exclusionNotFound } from './restrictions.errors.js'

const exclusionSelect = {
  id: true,
  ingredientName: true,
  createdAt: true,
} as const

@Injectable()
export class ExclusionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: PeopleService,
  ) {}

  async list(accountId: string, personId: string) {
    await this.people.assertExists(accountId, personId)
    return this.prisma.personExclusion.findMany({
      where: { personProfileId: personId },
      select: exclusionSelect,
      orderBy: { id: 'asc' },
    })
  }

  async add(
    accountId: string,
    personId: string,
    { ingredientName }: AddExclusionRequest,
  ) {
    await this.people.assertExists(accountId, personId)
    try {
      return await this.prisma.personExclusion.create({
        data: {
          personProfileId: personId,
          ingredientName,
          normalizedName: normalizeName(ingredientName),
        },
        select: exclusionSelect,
      })
    } catch (error) {
      if (!hasPrismaCode(error, 'P2002')) throw error
      throw new ApiException(
        409,
        'EXCLUSION_ALREADY_EXISTS',
        'This ingredient is already excluded',
      )
    }
  }

  async remove(accountId: string, personId: string, exclusionId: string) {
    await this.people.assertExists(accountId, personId)
    const { count } = await this.prisma.personExclusion.deleteMany({
      where: { id: exclusionId, personProfileId: personId },
    })
    if (count === 0) throw exclusionNotFound()
  }
}
