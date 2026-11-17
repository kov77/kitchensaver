import { createHash } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { AllergyStatus } from '../generated/prisma/client.js'
import { EntitlementsService } from '../entitlements/entitlements.service.js'
import { BodyParametersService } from '../nutrition-goals/body-parameters.service.js'
import { buildGoalFields } from '../nutrition-goals/goal-calculation.js'
import { NutritionGoalsService } from '../nutrition-goals/nutrition-goals.service.js'
import { calculateAge } from '../people/age.js'
import { parseSupportedDateOfBirth } from '../people/date-of-birth.js'
import { PeopleService } from '../people/people.service.js'
import { assertCanCreateProfile } from '../people/profile-limits.js'
import { AllergiesService } from '../restrictions/allergies.service.js'
import { ExclusionsService } from '../restrictions/exclusions.service.js'
import { PreferencesService } from '../restrictions/preferences.service.js'
import {
  allergyRow,
  exclusionRow,
  preferenceRow,
} from '../restrictions/restriction-rows.js'
import type { OnboardingDto, OnboardingRequest } from './onboarding.dto.js'

const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000

@Injectable()
export class OnboardingService {
  constructor(
    private readonly people: PeopleService,
    private readonly entitlements: EntitlementsService,
    private readonly goals: NutritionGoalsService,
    private readonly bodyParameters: BodyParametersService,
    private readonly allergies: AllergiesService,
    private readonly exclusions: ExclusionsService,
    private readonly preferences: PreferencesService,
  ) {}

  async onboard(
    accountId: string,
    idempotencyKey: string,
    request: OnboardingRequest,
  ): Promise<OnboardingDto> {
    const { name, bodyParameters, goal, allergies, exclusions, preferences } =
      request
    const dateOfBirth = parseSupportedDateOfBirth(request.dateOfBirth)
    const now = new Date()
    // Everything that can be rejected without the database is checked before the lock is taken.
    const goalFields =
      goal &&
      buildGoalFields(
        goal,
        calculateAge(dateOfBirth, now),
        bodyParameters ?? null,
        now,
      )
    const limits = await this.entitlements.getLimits(accountId)
    const requestHash = createHash('sha256')
      .update(JSON.stringify(request))
      .digest('hex')

    const personProfileId = await this.people.withAccountLock(
      accountId,
      async (tx) => {
        await tx.onboardingRequest.deleteMany({
          where: {
            accountId,
            createdAt: { lt: new Date(now.getTime() - IDEMPOTENCY_WINDOW_MS) },
          },
        })
        const earlier = await tx.onboardingRequest.findUnique({
          where: { accountId_idempotencyKey: { accountId, idempotencyKey } },
          select: { requestHash: true, personProfileId: true },
        })
        if (earlier) {
          if (earlier.requestHash === requestHash) {
            return earlier.personProfileId
          }
          throw new ApiException(
            409,
            'IDEMPOTENCY_KEY_REUSED',
            'This Idempotency-Key was already used with a different request',
          )
        }

        await assertCanCreateProfile(tx, accountId, limits)
        const { id } = await tx.personProfile.create({
          data: {
            accountId,
            name,
            dateOfBirth,
            allergyStatus: allergies.status,
            allergyStatusAt: now,
          },
          select: { id: true },
        })
        const owner = { personProfileId: id }
        if (bodyParameters) {
          await tx.personBodyParameters.create({
            data: { ...owner, ...bodyParameters },
          })
        }
        if (goalFields) {
          await tx.nutritionGoal.create({ data: { ...owner, ...goalFields } })
        }
        if (allergies.status === AllergyStatus.HAS_ALLERGIES) {
          await tx.personAllergy.createMany({
            data: allergies.items.map((allergy) => ({
              ...owner,
              ...allergyRow(allergy),
            })),
          })
        }
        await tx.personExclusion.createMany({
          data: exclusions.map((exclusion) => ({
            ...owner,
            ...exclusionRow(exclusion),
          })),
        })
        await tx.personFoodPreference.createMany({
          data: preferences.map((preference) => ({
            ...owner,
            ...preferenceRow(preference),
          })),
        })
        await tx.onboardingRequest.create({
          data: { accountId, idempotencyKey, requestHash, personProfileId: id },
        })
        return id
      },
    )
    return this.loadView(accountId, personProfileId)
  }

  // The same view serves the first response and every replay, so a replay shows the profile as it is now.
  private async loadView(
    accountId: string,
    personId: string,
  ): Promise<OnboardingDto> {
    const [person, goal, bodyParameters, allergies, exclusions, preferences] =
      await Promise.all([
        this.people.get(accountId, personId),
        this.goals.find(personId),
        this.bodyParameters.find(personId),
        this.allergies.list(accountId, personId),
        this.exclusions.list(accountId, personId),
        this.preferences.list(accountId, personId),
      ])
    return { person, goal, bodyParameters, allergies, exclusions, preferences }
  }
}
