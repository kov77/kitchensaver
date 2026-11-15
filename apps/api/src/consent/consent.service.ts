import { Injectable } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type {
  OnboardingStatusDto,
  RecordConsentsRequest,
} from './consent.dto.js'
import { CONSENT_CATEGORIES, CURRENT_LEGAL_VERSIONS } from './legal-versions.js'

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async getOnboardingStatus(accountId: string): Promise<OnboardingStatusDto> {
    const accepted = await this.prisma.accountConsent.findMany({
      where: {
        accountId,
        OR: CONSENT_CATEGORIES.map((category) => ({
          category,
          documentVersion: CURRENT_LEGAL_VERSIONS[category],
        })),
      },
      select: { category: true },
    })
    const acceptedCategories = new Set(accepted.map(({ category }) => category))
    const missing = CONSENT_CATEGORIES.filter(
      (category) => !acceptedCategories.has(category),
    )
    return {
      complete: missing.length === 0,
      missing,
      currentVersions: {
        adultAttestationVersion: CURRENT_LEGAL_VERSIONS.ADULT_ATTESTATION,
        termsVersion: CURRENT_LEGAL_VERSIONS.TERMS_OF_SERVICE,
        privacyVersion: CURRENT_LEGAL_VERSIONS.PRIVACY_POLICY,
      },
    }
  }

  async recordConsents(accountId: string, input: RecordConsentsRequest) {
    this.assertConfirmed(input)
    this.assertCurrentVersions(input)

    await this.prisma.accountConsent.createMany({
      data: CONSENT_CATEGORIES.map((category) => ({
        accountId,
        category,
        documentVersion: CURRENT_LEGAL_VERSIONS[category],
      })),
      skipDuplicates: true,
    })
    return this.getOnboardingStatus(accountId)
  }

  private assertConfirmed({
    adultConfirmed,
    acceptTerms,
    acknowledgePrivacy,
  }: RecordConsentsRequest) {
    if (!adultConfirmed) {
      throw new ApiException(
        422,
        'ADULT_CONFIRMATION_REQUIRED',
        'Confirm that you are at least 18 years old',
      )
    }
    if (!acceptTerms) {
      throw new ApiException(
        422,
        'TERMS_NOT_ACCEPTED',
        'Accept the terms of service',
      )
    }
    if (!acknowledgePrivacy) {
      throw new ApiException(
        422,
        'PRIVACY_NOT_ACKNOWLEDGED',
        'Acknowledge the privacy notice',
      )
    }
  }

  private assertCurrentVersions({
    termsVersion,
    privacyVersion,
  }: RecordConsentsRequest) {
    const isCurrent =
      termsVersion === CURRENT_LEGAL_VERSIONS.TERMS_OF_SERVICE &&
      privacyVersion === CURRENT_LEGAL_VERSIONS.PRIVACY_POLICY
    if (isCurrent) return
    throw new ApiException(
      422,
      'LEGAL_VERSION_NOT_CURRENT',
      'The legal documents have changed; reload them and confirm again',
    )
  }
}
