import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { EntitlementsService } from '../entitlements/entitlements.service.js'
import type { PersonProfile, Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  calculateAge,
  isSupportedAge,
  MAX_PROFILE_AGE,
  MIN_PROFILE_AGE,
} from './age.js'
import type {
  PeopleStatusFilter,
  PersonDetailDto,
  PersonListItemDto,
} from './people.dto.js'
import { personNotFound } from './people.errors.js'

// Requests of one account queue on the Account row lock, so the Prisma defaults (2s/5s) are too tight.
const LOCK_TIMEOUT_MS = 10_000

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

  async list(accountId: string, status: PeopleStatusFilter) {
    const archivedFilter: Prisma.PersonProfileWhereInput =
      status === 'active'
        ? { archivedAt: null }
        : status === 'archived'
          ? { archivedAt: { not: null } }
          : {}
    const people = await this.prisma.personProfile.findMany({
      where: { accountId, ...archivedFilter },
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
    {
      name,
      dateOfBirth: isoDateOfBirth,
    }: { name: string; dateOfBirth: string },
  ) {
    const dateOfBirth = parseSupportedDateOfBirth(isoDateOfBirth)
    const person = await this.withAccountLock(accountId, async (tx) => {
      await this.assertActiveSlotAvailable(tx, accountId)
      return tx.personProfile.create({
        data: { accountId, name, dateOfBirth },
      })
    })
    return toDetail(person)
  }

  async update(
    accountId: string,
    id: string,
    {
      name,
      dateOfBirth: isoDateOfBirth,
    }: { name?: string; dateOfBirth?: string },
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
    const person = await this.withAccountLock(accountId, async (tx) => {
      const existing = await tx.personProfile.findFirst({
        where: { id, accountId },
      })
      if (!existing) throw personNotFound()
      if (!existing.archivedAt) return existing
      await this.assertActiveSlotAvailable(tx, accountId)
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
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM account WHERE id = ${accountId}::uuid FOR NO KEY UPDATE`
        return work(tx)
      },
      { maxWait: LOCK_TIMEOUT_MS, timeout: LOCK_TIMEOUT_MS },
    )
  }

  private async assertActiveSlotAvailable(
    { personProfile }: Prisma.TransactionClient,
    accountId: string,
  ) {
    const [{ activeProfiles }, activeCount] = await Promise.all([
      this.entitlements.getLimits(accountId),
      personProfile.count({ where: { accountId, archivedAt: null } }),
    ])
    if (activeCount < activeProfiles) return
    throw new ApiException(
      409,
      'PROFILE_LIMIT_REACHED',
      'The limit of active profiles is reached',
      { limit: activeProfiles },
    )
  }
}
