import { Test } from '@nestjs/testing'
import { getOptionsToken } from '@nestjs/throttler'
import { onTestFinished } from 'vitest'

import { AppModule } from '../../src/app.module.js'
import { configureApp } from '../../src/app.setup.js'
import {
  TOKEN_VERIFIER,
  type TokenVerifier,
} from '../../src/auth/token-verifier.js'
import type { Env } from '../../src/config/env.js'
import {
  createRateLimitOptions,
  DEFAULT_RATE_LIMITS,
  type RateLimits,
} from '../../src/rate-limit/rate-limit.options.js'
import { ProbeController, StrictProbeController } from './probe.controller.js'
import { createTestTokenVerifier } from './test-auth.js'

export async function createTestApp(
  nodeEnv: Env['NODE_ENV'] = 'test',
  tokenVerifier: TokenVerifier = createTestTokenVerifier(),
  rateLimits: RateLimits = DEFAULT_RATE_LIMITS,
) {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [ProbeController, StrictProbeController],
  })
    .overrideProvider(TOKEN_VERIFIER)
    .useValue(tokenVerifier)
    .overrideProvider(getOptionsToken())
    .useValue(createRateLimitOptions(rateLimits))
    .compile()
  const app = moduleRef.createNestApplication()
  configureApp(app, nodeEnv)
  await app.init()
  onTestFinished(() => app.close())
  return app
}
