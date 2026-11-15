import { ConsentCategory } from '../generated/prisma/client.js'

// Draft identifiers for development; replaced by the final legal text versions before launch.
export const CURRENT_LEGAL_VERSIONS: Record<ConsentCategory, string> = {
  ADULT_ATTESTATION: 'adult-attestation-v1',
  TERMS_OF_SERVICE: '2026-11-draft',
  PRIVACY_POLICY: '2026-11-draft',
}

export const CONSENT_CATEGORIES = Object.values(ConsentCategory)
