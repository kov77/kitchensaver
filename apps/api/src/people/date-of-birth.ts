import { ApiException } from '../common/api-exception.js'
import {
  calculateAge,
  isSupportedAge,
  MAX_PROFILE_AGE,
  MIN_PROFILE_AGE,
} from './age.js'

export function parseSupportedDateOfBirth(isoDate: string) {
  const dateOfBirth = new Date(`${isoDate}T00:00:00Z`)
  if (!isSupportedAge(calculateAge(dateOfBirth, new Date()))) {
    throw new ApiException(
      422,
      'PERSON_AGE_NOT_SUPPORTED',
      `The person must be between ${MIN_PROFILE_AGE} and ${MAX_PROFILE_AGE} years old`,
    )
  }
  return dateOfBirth
}
