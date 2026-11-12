import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import type { AuthenticatedRequest } from './authenticated-request.js'
import { AuthService } from './auth.service.js'
import { IS_PUBLIC_KEY } from './public.decorator.js'
import {
  InvalidTokenError,
  TOKEN_VERIFIER,
  type TokenVerifier,
  TokenVerificationUnavailableError,
} from './token-verifier.js'

function extractBearerToken(header: string | undefined) {
  const parts = header?.split(' ')
  if (parts?.length !== 2) return undefined
  const [scheme, token] = parts
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined
  return token
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = extractBearerToken(request.headers.authorization)
    if (!token) throw new UnauthorizedException()

    try {
      const { subject } = await this.tokenVerifier.verify(token)
      request.accountId = await this.authService.resolveAccountId(subject)
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        this.logger.warn(`Access token rejected: ${error.reason}`)
        throw new UnauthorizedException()
      }
      if (error instanceof TokenVerificationUnavailableError) {
        this.logger.error(`Access token not verifiable: ${error.reason}`)
        throw new ServiceUnavailableException()
      }
      throw error
    }
    return true
  }
}
