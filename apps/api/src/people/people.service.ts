import { canEstimateEnergy } from '@kitchensaver/nutrition'
import { Injectable } from '@nestjs/common'
import * as zod from 'zod'

import { ApiException } from '../common/api-exception.js'
import { EntitlementsService } from '../entitlements/entitlements.service.js'
import { Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  assertActiveSlotAvailable,
  assertCanCreateProfile,
} from './profile-limits.js'
import { calculateAge } from './age.js'
import { parseSupportedDateOfBirth } from './date-of-birth.js'
import type {
  CreatePersonRequest,
  ListPeopleQuery,
  PersonDetailDto,
  PersonListItemDto,
  UpdatePersonRequest,
} from './people.dto.js'
import { personNotFound } from './people.errors.js'
import { planReadiness } from './plan-readiness.js'

const TRANSACTION_TIMEOUT_MS = 10_000

const LOCK_WAIT_MS = 5_000

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

type PersonWithGoal = Prisma.PersonProfileGetPayload<{
  include: { goal: true }
}>

function toListItem({
  id,
  name,
  dateOfBirth,
  archivedAt,
  goal,
  allergyStatus,
}: PersonWithGoal): PersonListItemDto {
  const age = calculateAge(dateOfBirth, new Date())
  return {
    id,
    name,
    age,
    goal: goal && {
      mode: goal.mode,
      dailyKcal: goal.dailyKcal,
      goalType: goal.goalType,
    },
    planReadiness: planReadiness(age, goal, allergyStatus),
    archivedAt: archivedAt?.toISOString() ?? null,
  }
}

function toDetail(person: PersonWithGoal): PersonDetailDto {
  const { dateOfBirth, createdAt, allergyStatus, allergyStatusAt } = person
  const listItem = toListItem(person)
  return {
    ...listItem,
    dateOfBirth: toIsoDate(dateOfBirth),
    allergyStatus,
    allergyStatusAt: allergyStatusAt?.toISOString() ?? null,
    capabilities: { goalEstimation: canEstimateEnergy(listItem.age) },
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

@Injectable()
export class PeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async list(accountId: string, status: ListPeopleQuery['status']) {
    const people = await this.prisma.personProfile.findMany({
      where: { accountId, ...ARCHIVED_FILTERS[status] },
      include: { goal: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
    return people.map(toListItem)
  }

  async get(accountId: string, id: string) {
    const person = await this.prisma.personProfile.findFirst({
      where: { id, accountId },
      include: { goal: true },
    })
    if (!person) throw personNotFound()
    return toDetail(person)
  }

  async assertExists(accountId: string, id: string) {
    await this.getDateOfBirth(accountId, id)
  }

  async getDateOfBirth(accountId: string, id: string) {
    const person = await this.prisma.personProfile.findFirst({
      where: { id, accountId },
      select: { dateOfBirth: true },
    })
    if (!person) throw personNotFound()
    return person.dateOfBirth
  }

  async create(
    accountId: string,
    { name, dateOfBirth: isoDateOfBirth }: CreatePersonRequest,
  ) {
    const dateOfBirth = parseSupportedDateOfBirth(isoDateOfBirth)
    const limits = await this.entitlements.getLimits(accountId)
    const person = await this.withAccountLock(accountId, async (tx) => {
      await assertCanCreateProfile(tx, accountId, limits)
      return tx.personProfile.create({
        data: { accountId, name, dateOfBirth },
        include: { goal: true },
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
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.personProfile.findFirst({
        where: { id, accountId },
        select: { dateOfBirth: true },
      })
      if (!existing) throw personNotFound()
      await tx.personProfile.updateMany({
        where: { id, accountId },
        data: { name, dateOfBirth },
      })
      const isDateOfBirthChanged =
        dateOfBirth !== undefined &&
        dateOfBirth.getTime() !== existing.dateOfBirth.getTime()
      if (!isDateOfBirthChanged) return

      await tx.nutritionGoal.updateMany({
        where: { personProfileId: id, mode: 'ESTIMATED' },
        data: { reviewRequiredAt: new Date() },
      })
    })
    return this.get(accountId, id)
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
    await this.withAccountLock(accountId, async (tx) => {
      const existing = await tx.personProfile.findFirst({
        where: { id, accountId },
        select: { archivedAt: true },
      })
      if (!existing) throw personNotFound()
      if (!existing.archivedAt) return
      await assertActiveSlotAvailable(tx, accountId, activeProfiles)
      await tx.personProfile.updateMany({
        where: { id, accountId },
        data: { archivedAt: null },
      })
    })
    return this.get(accountId, id)
  }

  async remove(accountId: string, id: string) {
    const { count } = await this.prisma.personProfile.deleteMany({
      where: { id, accountId },
    })
    if (count === 0) throw personNotFound()
  }

  withAccountLock<T>(
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
