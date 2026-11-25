import { RESPONSE_STATUS_CODE } from '@/core/constants'

import { BODY_PARAMETERS_NOT_FOUND_CODE } from './constants'
import { hasErrorCode } from './unwrapResponse'

export function isBodyParametersNotFound(result: {
  error?: unknown
  response: Response
}) {
  return (
    result.response.status === RESPONSE_STATUS_CODE.NOT_FOUND &&
    hasErrorCode(result, BODY_PARAMETERS_NOT_FOUND_CODE)
  )
}
