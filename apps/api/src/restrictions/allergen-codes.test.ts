import { ALLERGEN_CODES, ALLERGY_STATUSES } from '@kitchensaver/nutrition'
import { describe, expect, it } from 'vitest'

import { AllergenCode, AllergyStatus } from '../generated/prisma/client.js'

describe('codes shared with the nutrition package', () => {
  it('has the same allergen codes as the database enum', () => {
    expect(Object.values(AllergenCode).sort()).toEqual(
      [...ALLERGEN_CODES].sort(),
    )
  })

  it('has the same allergy statuses as the database enum', () => {
    expect(Object.values(AllergyStatus).sort()).toEqual(
      [...ALLERGY_STATUSES].sort(),
    )
  })
})
