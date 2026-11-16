import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { hasPrismaCode } from '../common/prisma-errors.js'
import { personNotFound } from '../people/people.errors.js'
import { PeopleService } from '../people/people.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type { BodyParametersRequest } from './nutrition-goals.dto.js'

const bodyParametersSelect = {
  heightCm: true,
  weightKg: true,
  activityLevel: true,
  formulaSex: true,
  updatedAt: true,
} as const

function bodyParametersNotFound() {
  return new ApiException(
    404,
    'BODY_PARAMETERS_NOT_FOUND',
    'No body parameters are stored for this person',
  )
}

@Injectable()
export class BodyParametersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: PeopleService,
  ) {}

  async get(accountId: string, personId: string) {
    await this.people.assertExists(accountId, personId)
    const stored = await this.find(personId)
    if (!stored) throw bodyParametersNotFound()
    return stored
  }

  find(personId: string) {
    return this.prisma.personBodyParameters.findUnique({
      where: { personProfileId: personId },
      select: bodyParametersSelect,
    })
  }

  async save(
    accountId: string,
    personId: string,
    request: BodyParametersRequest,
  ) {
    await this.people.assertExists(accountId, personId)
    try {
      return await this.prisma.personBodyParameters.upsert({
        where: { personProfileId: personId },
        create: { personProfileId: personId, ...request },
        update: request,
        select: bodyParametersSelect,
      })
    } catch (error) {
      if (hasPrismaCode(error, 'P2003')) throw personNotFound()
      throw error
    }
  }

  async remove(accountId: string, personId: string) {
    await this.people.assertExists(accountId, personId)
    const { count } = await this.prisma.personBodyParameters.deleteMany({
      where: { personProfileId: personId },
    })
    if (count === 0) throw bodyParametersNotFound()
  }
}
