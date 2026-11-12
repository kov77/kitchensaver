import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'

import type { Env } from '../config/env.js'
import { AuthGuard } from './auth.guard.js'
import { AuthService } from './auth.service.js'
import { createRemoteTokenVerifier, TOKEN_VERIFIER } from './token-verifier.js'

@Module({
  providers: [
    AuthService,
    {
      provide: TOKEN_VERIFIER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createRemoteTokenVerifier({
          jwksUrl: config.get('AUTH_JWKS_URL', { infer: true }),
          issuer: config.get('AUTH_ISSUER', { infer: true }),
          audience: config.get('AUTH_AUDIENCE', { infer: true }),
        }),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}
