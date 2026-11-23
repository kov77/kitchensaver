import * as zod from 'zod'

import { ApiRequestError } from '@/utils/errors'

type ApiResult<Data> = { data?: Data; error?: unknown; response: Response }

const errorBodySchema = zod.object({ code: zod.string() })

function toRequestError({ error, response }: ApiResult<unknown>) {
  const body = errorBodySchema.safeParse(error)
  return new ApiRequestError(
    response.status,
    body.success ? body.data.code : undefined,
  )
}

export function unwrapResponse<Data>(result: ApiResult<Data>): Data {
  const { data } = result
  if (data === undefined || data === null) throw toRequestError(result)
  return data
}

export function assertResponseOk(result: ApiResult<unknown>) {
  if (!result.response.ok) throw toRequestError(result)
}
