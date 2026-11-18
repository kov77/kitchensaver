import { ConsentCategory } from '../generated/prisma/client.js'

export const CURRENT_LEGAL_VERSIONS: Record<ConsentCategory, string> = {
  ADULT_ATTESTATION: 'adult-attestation-v1',
  TERMS_OF_SERVICE: '2026-11-draft',
  PRIVACY_POLICY: '2026-11-draft',
}

export const CONSENT_CATEGORIES = Object.values(ConsentCategory)
