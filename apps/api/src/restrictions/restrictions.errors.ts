import { Param, ParseUUIDPipe } from '@nestjs/common'

import { ApiException } from '../common/api-exception.js'

export function allergyNotFound() {
  return new ApiException(404, 'ALLERGY_NOT_FOUND', 'Allergy not found')
}

export function exclusionNotFound() {
  return new ApiException(404, 'EXCLUSION_NOT_FOUND', 'Exclusion not found')
}

export function preferenceNotFound() {
  return new ApiException(404, 'PREFERENCE_NOT_FOUND', 'Preference not found')
}

export const AllergyId = () =>
  Param('allergyId', new ParseUUIDPipe({ exceptionFactory: allergyNotFound }))

export const ExclusionId = () =>
  Param(
    'exclusionId',
    new ParseUUIDPipe({ exceptionFactory: exclusionNotFound }),
  )

export const PreferenceId = () =>
  Param(
    'preferenceId',
    new ParseUUIDPipe({ exceptionFactory: preferenceNotFound }),
  )
