import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

import type { AuthenticatedRequest } from './authenticated-request.js'

export const CurrentAccount = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().accountId,
)
