import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { hasPrismaCode } from '../common/prisma-errors.js'
import { AllergenCode } from '../generated/prisma/client.js'
import { personNotFound } from '../people/people.errors.js'
import { PeopleService } from '../people/people.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { markAsHavingAllergies, resetAllergyStatus } from './allergy-status.js'
import { normalizeName } from './normalize-name.js'
import { allergyRow } from './restriction-rows.js'
import type {
  AddAllergyRequest,
  AllergyDto,
  UpdateAllergyRequest,
} from './restrictions.dto.js'
import { MAX_ALLERGIES } from './restriction-limits.js'
import {
  allergyNotFound,
  restrictionLimitReached,
} from './restrictions.errors.js'

const allergySelect = {
  id: true,
  allergenCode: true,
  customLabel: true,
  createdAt: true,
} as const

function allergyAlreadyExists() {
  return new ApiException(
    409,
    'ALLERGY_ALREADY_EXISTS',
    'This allergy is already listed',
  )
}

function withResolved<T extends { allergenCode: AllergenCode }>(allergy: T) {
  return { ...allergy, resolved: allergy.allergenCode !== AllergenCode.OTHER }
}

@Injectable()
export class AllergiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: PeopleService,
  ) {}

  async list(accountId: string, personId: string): Promise<AllergyDto[]> {
    await this.people.assertExists(accountId, personId)
    const allergies = await this.prisma.personAllergy.findMany({
      where: { personProfileId: personId },
      select: allergySelect,
      orderBy: { id: 'asc' },
    })
    return allergies.map(withResolved)
  }

  async add(
    accountId: string,
    personId: string,
    request: AddAllergyRequest,
  ): Promise<AllergyDto> {
    await this.people.assertExists(accountId, personId)
    try {
      const allergy = await this.people.withAccountLock(
        accountId,
        async ({ personAllergy, personProfile }) => {
          const count = await personAllergy.count({
            where: { personProfileId: personId },
          })
          if (count >= MAX_ALLERGIES) {
            throw restrictionLimitReached(MAX_ALLERGIES)
          }
          const created = await personAllergy.create({
            data: { personProfileId: personId, ...allergyRow(request) },
            select: allergySelect,
          })
          await markAsHavingAllergies(personProfile, accountId, personId)
          return created
        },
      )
      return withResolved(allergy)
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) throw allergyAlreadyExists()
      if (hasPrismaCode(error, 'P2003')) throw personNotFound()
      throw error
    }
  }

  async updateLabel(
    accountId: string,
    personId: string,
    allergyId: string,
    { customLabel }: UpdateAllergyRequest,
  ): Promise<AllergyDto> {
    await this.people.assertExists(accountId, personId)
    const existing = await this.prisma.personAllergy.findFirst({
      where: { id: allergyId, personProfileId: personId },
      select: { allergenCode: true },
    })
    if (!existing) throw allergyNotFound()
    if (existing.allergenCode !== AllergenCode.OTHER) {
      throw new ApiException(
        422,
        'ALLERGY_LABEL_NOT_APPLICABLE',
        'Only an OTHER allergy has a label',
      )
    }
    try {
      const allergy = await this.prisma.personAllergy.update({
        where: { id: allergyId, personProfileId: personId },
        data: { customLabel, normalizedLabel: normalizeName(customLabel) },
        select: allergySelect,
      })
      return withResolved(allergy)
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) throw allergyAlreadyExists()
      if (hasPrismaCode(error, 'P2025')) throw allergyNotFound()
      throw error
    }
  }

  async remove(accountId: string, personId: string, allergyId: string) {
    await this.people.assertExists(accountId, personId)
    await this.people.withAccountLock(
      accountId,
      async ({ personAllergy, personProfile }) => {
        const { count } = await personAllergy.deleteMany({
          where: { id: allergyId, personProfileId: personId },
        })
        if (count === 0) throw allergyNotFound()
        const remaining = await personAllergy.count({
          where: { personProfileId: personId },
        })
        if (remaining === 0) {
          await resetAllergyStatus(personProfile, accountId, personId)
        }
      },
    )
  }
}
