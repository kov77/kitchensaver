import * as zod from 'zod'

import { ApiRequestError } from '@/utils/errors'

type ApiResult<Data> = { data?: Data; error?: unknown; response: Response }

const errorBodySchema = zod.object({ code: zod.string() })

function getErrorCode(error: unknown) {
  const body = errorBodySchema.safeParse(error)
  return body.success ? body.data.code : undefined
}

function toRequestError({ error, response }: ApiResult<unknown>) {
  return new ApiRequestError(response.status, getErrorCode(error))
}

export function hasErrorCode({ error }: ApiResult<unknown>, code: string) {
  return getErrorCode(error) === code
}

export function unwrapResponse<Data>(result: ApiResult<Data>): Data {
  const { data } = result
  if (data === undefined || data === null) throw toRequestError(result)
  return data
}

export function assertResponseOk(result: ApiResult<unknown>) {
  if (!result.response.ok) throw toRequestError(result)
}
