import { Injectable } from '@nestjs/common'
import * as zod from 'zod'

import { ApiException } from '../common/api-exception.js'
import { EntitlementsService } from '../entitlements/entitlements.service.js'
import { type PersonProfile, Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  calculateAge,
  isSupportedAge,
  MAX_PROFILE_AGE,
  MIN_PROFILE_AGE,
} from './age.js'
import type {
  CreatePersonRequest,
  ListPeopleQuery,
  PersonDetailDto,
  PersonListItemDto,
  UpdatePersonRequest,
} from './people.dto.js'
import { personNotFound } from './people.errors.js'

// Requests of one account queue on the Account row lock, so the Prisma defaults (2s/5s) are too tight.
const TRANSACTION_TIMEOUT_MS = 10_000
// The database gives up waiting for the lock before the Prisma transaction timeout cuts the connection.
const LOCK_WAIT_MS = 5_000

function toDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`)
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toListItem({
  id,
  name,
  dateOfBirth,
  archivedAt,
}: PersonProfile): PersonListItemDto {
  return {
    id,
    name,
    age: calculateAge(dateOfBirth, new Date()),
    archivedAt: archivedAt?.toISOString() ?? null,
  }
}

function toDetail(person: PersonProfile): PersonDetailDto {
  const { dateOfBirth, createdAt } = person
  return {
    ...toListItem(person),
    dateOfBirth: toIsoDate(dateOfBirth),
    capabilities: { goalEstimation: true },
    createdAt: createdAt.toISOString(),
  }
}

const ARCHIVED_FILTERS = {
  active: { archivedAt: null },
  archived: { archivedAt: { not: null } },
  all: {},
} satisfies Record<ListPeopleQuery['status'], Prisma.PersonProfileWhereInput>

const lockTimeoutMetaSchema = zod.object({
  driverAdapterError: zod.object({
    cause: zod.object({ code: zod.literal('55P03') }),
  }),
})

function isLockTimeout(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2010' &&
    lockTimeoutMetaSchema.safeParse(error.meta).success
  )
}

async function assertActiveSlotAvailable(
  { personProfile }: Prisma.TransactionClient,
  accountId: string,
  activeProfilesLimit: number,
) {
  const activeCount = await personProfile.count({
    where: { accountId, archivedAt: null },
  })
  if (activeCount < activeProfilesLimit) return
  throw new ApiException(
    409,
    'PROFILE_LIMIT_REACHED',
    'The limit of active profiles is reached',
    { limit: activeProfilesLimit },
  )
}

function parseSupportedDateOfBirth(isoDate: string) {
  const dateOfBirth = toDate(isoDate)
  if (!isSupportedAge(calculateAge(dateOfBirth, new Date()))) {
    throw new ApiException(
      422,
      'PERSON_AGE_NOT_SUPPORTED',
      `The person must be between ${MIN_PROFILE_AGE} and ${MAX_PROFILE_AGE} years old`,
    )
  }
  return dateOfBirth
}

@Injectable()
export class PeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async list(accountId: string, status: ListPeopleQuery['status']) {
    const people = await this.prisma.personProfile.findMany({
      where: { accountId, ...ARCHIVED_FILTERS[status] },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
    return people.map(toListItem)
  }

  async get(accountId: string, id: string) {
    const person = await this.prisma.personProfile.findFirst({
      where: { id, accountId },
    })
    if (!person) throw personNotFound()
    return toDetail(person)
  }

  async create(
    accountId: string,
    { name, dateOfBirth: isoDateOfBirth }: CreatePersonRequest,
  ) {
    const dateOfBirth = parseSupportedDateOfBirth(isoDateOfBirth)
    const { activeProfiles } = await this.entitlements.getLimits(accountId)
    const person = await this.withAccountLock(accountId, async (tx) => {
      await assertActiveSlotAvailable(tx, accountId, activeProfiles)
      return tx.personProfile.create({
        data: { accountId, name, dateOfBirth },
      })
    })
    return toDetail(person)
  }

  async update(
    accountId: string,
    id: string,
    { name, dateOfBirth: isoDateOfBirth }: UpdatePersonRequest,
  ) {
    const dateOfBirth =
      isoDateOfBirth === undefined
        ? undefined
        : parseSupportedDateOfBirth(isoDateOfBirth)
    const [person] = await this.prisma.personProfile.updateManyAndReturn({
      where: { id, accountId },
      data: { name, dateOfBirth },
    })
    if (!person) throw personNotFound()
    return toDetail(person)
  }

  async archive(accountId: string, id: string) {
    await this.prisma.personProfile.updateMany({
      where: { id, accountId, archivedAt: null },
      data: { archivedAt: new Date() },
    })
    return this.get(accountId, id)
  }

  async restore(accountId: string, id: string) {
    const { activeProfiles } = await this.entitlements.getLimits(accountId)
    const person = await this.withAccountLock(accountId, async (tx) => {
      const existing = await tx.personProfile.findFirst({
        where: { id, accountId },
      })
      if (!existing) throw personNotFound()
      if (!existing.archivedAt) return existing
      await assertActiveSlotAvailable(tx, accountId, activeProfiles)
      const [restored] = await tx.personProfile.updateManyAndReturn({
        where: { id, accountId },
        data: { archivedAt: null },
      })
      if (!restored) throw personNotFound()
      return restored
    })
    return toDetail(person)
  }

  async remove(accountId: string, id: string) {
    const { count } = await this.prisma.personProfile.deleteMany({
      where: { id, accountId },
    })
    if (count === 0) throw personNotFound()
  }

  // The Account row lock serializes limit checks of one account across parallel requests.
  private withAccountLock<T>(
    accountId: string,
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.prisma
      .$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT set_config('lock_timeout', ${String(LOCK_WAIT_MS)}, true)`
          await tx.$queryRaw`SELECT id FROM account WHERE id = ${accountId}::uuid FOR NO KEY UPDATE`
          return work(tx)
        },
        { maxWait: TRANSACTION_TIMEOUT_MS, timeout: TRANSACTION_TIMEOUT_MS },
      )
      .catch((error: unknown) => {
        if (!isLockTimeout(error)) throw error
        throw new ApiException(
          503,
          'SERVICE_BUSY',
          'Too many simultaneous requests for this account; try again',
        )
      })
  }
}
