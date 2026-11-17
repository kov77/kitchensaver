import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { hasPrismaCode } from '../common/prisma-errors.js'
import { personNotFound } from '../people/people.errors.js'
import { PeopleService } from '../people/people.service.js'
import type {
  AllergyStatusDto,
  SetAllergyStatusRequest,
} from './restrictions.dto.js'

function allergiesExist() {
  return new ApiException(
    409,
    'ALLERGIES_EXIST',
    'Delete the listed allergies before saying there are none or that they are unknown',
  )
}

@Injectable()
export class AllergyStatusService {
  constructor(private readonly people: PeopleService) {}

  async set(
    accountId: string,
    personId: string,
    { status }: SetAllergyStatusRequest,
  ): Promise<AllergyStatusDto> {
    await this.people.assertExists(accountId, personId)
    try {
      return await this.people.withAccountLock(
        accountId,
        async ({ personAllergy, personProfile }) => {
          const count = await personAllergy.count({
            where: { personProfileId: personId },
          })
          if (count > 0) throw allergiesExist()
          const allergyStatusAt = new Date()
          await personProfile.update({
            where: { id: personId, accountId },
            data: { allergyStatus: status, allergyStatusAt },
          })
          return { allergyStatus: status, allergyStatusAt }
        },
      )
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) throw personNotFound()
      throw error
    }
  }
}
