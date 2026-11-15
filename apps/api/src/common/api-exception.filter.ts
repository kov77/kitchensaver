import { STATUS_CODES } from 'node:http'
import { randomUUID } from 'node:crypto'

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common'
import type { Response } from 'express'

import { ApiException } from './api-exception.js'

export const REQUEST_ID_HEADER = 'X-Request-Id'

const GENERIC_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()
    const requestId = randomUUID()

    const { status, code, message, details } = this.describe(exception)
    if (status >= 500) {
      const name = exception instanceof Error ? exception.name : 'Unknown'
      this.logger.error(`Request ${requestId} failed: ${name}`)
    }

    response
      .status(status)
      .setHeader(REQUEST_ID_HEADER, requestId)
      .json({ code, message, details, requestId })
  }

  private describe(exception: unknown) {
    if (exception instanceof ApiException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      }
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      return {
        status,
        code: GENERIC_CODES[status] ?? 'HTTP_ERROR',
        message: STATUS_CODES[status] ?? 'Error',
        details: undefined,
      }
    }
    return {
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      details: undefined,
    }
  }
}
