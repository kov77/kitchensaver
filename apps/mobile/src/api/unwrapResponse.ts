import { ApiRequestError } from '@/utils/errors'

type ApiResult<Data> = { data?: Data; response: Response }

export function unwrapResponse<Data>({
  data,
  response,
}: ApiResult<Data>): Data {
  if (data === undefined || data === null)
    throw new ApiRequestError(response.status)
  return data
}
