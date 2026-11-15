import { ApiException } from '../common/api-exception.js'

export function personNotFound() {
  return new ApiException(404, 'PERSON_NOT_FOUND', 'Person not found')
}
