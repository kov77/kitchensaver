import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { hasPrismaCode } from '../common/prisma-errors.js'
import { PeopleService } from '../people/people.service.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { preferenceRow } from './restriction-rows.js'
import type {
  AddPreferenceRequest,
  UpdatePreferenceRequest,
} from './restrictions.dto.js'
import { preferenceNotFound } from './restrictions.errors.js'

const preferenceSelect = {
  id: true,
  ingredientName: true,
  rating: true,
  updatedAt: true,
} as const

@Injectable()
export class PreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly people: PeopleService,
  ) {}

  async list(accountId: string, personId: string) {
    await this.people.assertExists(accountId, personId)
    return this.prisma.personFoodPreference.findMany({
      where: { personProfileId: personId },
      select: preferenceSelect,
      orderBy: { id: 'asc' },
    })
  }

  async add(
    accountId: string,
    personId: string,
    request: AddPreferenceRequest,
  ) {
    await this.people.assertExists(accountId, personId)
    try {
      return await this.prisma.personFoodPreference.create({
        data: { personProfileId: personId, ...preferenceRow(request) },
        select: preferenceSelect,
      })
    } catch (error) {
      if (!hasPrismaCode(error, 'P2002')) throw error
      throw new ApiException(
        409,
        'PREFERENCE_ALREADY_EXISTS',
        'This ingredient already has a rating',
      )
    }
  }

  async updateRating(
    accountId: string,
    personId: string,
    preferenceId: string,
    { rating }: UpdatePreferenceRequest,
  ) {
    await this.people.assertExists(accountId, personId)
    try {
      return await this.prisma.personFoodPreference.update({
        where: { id: preferenceId, personProfileId: personId },
        data: { rating },
        select: preferenceSelect,
      })
    } catch (error) {
      if (!hasPrismaCode(error, 'P2025')) throw error
      throw preferenceNotFound()
    }
  }

  async remove(accountId: string, personId: string, preferenceId: string) {
    await this.people.assertExists(accountId, personId)
    const { count } = await this.prisma.personFoodPreference.deleteMany({
      where: { id: preferenceId, personProfileId: personId },
    })
    if (count === 0) throw preferenceNotFound()
  }
}
