import {
  createRemoteJWKSet,
  errors,
  jwtVerify,
  type JWTVerifyGetKey,
} from 'jose'

export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER')

export interface VerifiedToken {
  subject: string
}

export interface TokenVerifier {
  verify(token: string): Promise<VerifiedToken>
}

export class InvalidTokenError extends Error {
  constructor(readonly reason: string) {
    super('Invalid access token')
  }
}

export class TokenVerificationUnavailableError extends Error {
  constructor(readonly reason: string) {
    super('Access token could not be verified')
  }
}

const REJECTED_TOKEN_CODES: ReadonlySet<string> = new Set([
  'ERR_JWT_EXPIRED',
  'ERR_JWT_CLAIM_VALIDATION_FAILED',
  'ERR_JWT_INVALID',
  'ERR_JWS_INVALID',
  'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
  'ERR_JOSE_ALG_NOT_ALLOWED',
  'ERR_JOSE_NOT_SUPPORTED',
  'ERR_JWKS_NO_MATCHING_KEY',
  'ERR_JWKS_MULTIPLE_MATCHING_KEYS',
])

export class JwtTokenVerifier implements TokenVerifier {
  constructor(
    private readonly keys: JWTVerifyGetKey,
    private readonly issuer: string,
    private readonly audience: string,
  ) {}

  async verify(token: string): Promise<VerifiedToken> {
    try {
      const { payload } = await jwtVerify(token, this.keys, {
        algorithms: ['ES256'],
        issuer: this.issuer,
        audience: this.audience,
        requiredClaims: ['sub', 'exp'],
      })
      if (!payload.sub) throw new InvalidTokenError('missing_subject')
      return { subject: payload.sub }
    } catch (error) {
      if (error instanceof InvalidTokenError) throw error
      if (
        error instanceof errors.JOSEError &&
        REJECTED_TOKEN_CODES.has(error.code)
      ) {
        throw new InvalidTokenError(error.code)
      }
      throw new TokenVerificationUnavailableError(
        error instanceof errors.JOSEError ? error.code : 'unexpected_error',
      )
    }
  }
}

export function createRemoteTokenVerifier(options: {
  jwksUrl: string
  issuer: string
  audience: string
}) {
  return new JwtTokenVerifier(
    createRemoteJWKSet(new URL(options.jwksUrl)),
    options.issuer,
    options.audience,
  )
}
