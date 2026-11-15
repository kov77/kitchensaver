import type { INestApplication } from '@nestjs/common'

import type { Env } from './config/env.js'
import { createValidationPipe } from './common/validation.pipe.js'
import { setupSwagger } from './openapi/swagger.js'

export function configureApp(app: INestApplication, nodeEnv: Env['NODE_ENV']) {
  app.setGlobalPrefix('api/v1', { exclude: ['health'] })
  app.useGlobalPipes(createValidationPipe())
  setupSwagger(app, nodeEnv)
}
