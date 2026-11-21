import type { UseMutationResult } from '@tanstack/react-query'

import type { AllergyItem } from '@/core/types'

export type AddAllergies = UseMutationResult<void, Error, AllergyItem[]>
