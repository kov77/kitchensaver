import type { INestApplication } from '@nestjs/common'

import type { Env } from './config/env.js'
import { setupSwagger } from './openapi/swagger.js'

export function configureApp(app: INestApplication, nodeEnv: Env['NODE_ENV']) {
  setupSwagger(app, nodeEnv)
}
