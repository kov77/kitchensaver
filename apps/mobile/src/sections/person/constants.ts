import type { CommonKey } from '@/translations/types'

export const ALLERGY_STATUS_LABEL_KEYS: Record<
  'NOT_ANSWERED' | 'NONE' | 'UNKNOWN',
  CommonKey
> = {
  NOT_ANSWERED: 'common:allergy-status-NOT_ANSWERED',
  NONE: 'common:allergy-status-NONE',
  UNKNOWN: 'common:allergy-status-UNKNOWN',
}
