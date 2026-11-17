import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import type { Env } from '../config/env.js'

export const SWAGGER_PATH = 'api/docs'

export function isSwaggerServed(nodeEnv: Env['NODE_ENV']) {
  return nodeEnv !== 'production'
}

export function setupSwagger(app: INestApplication, nodeEnv: Env['NODE_ENV']) {
  if (!isSwaggerServed(nodeEnv)) return

  const config = new DocumentBuilder()
    .setTitle('KitchenSaver API')
    .setDescription('REST API of the KitchenSaver mobile app')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()

  SwaggerModule.setup(SWAGGER_PATH, app, () =>
    SwaggerModule.createDocument(app, config),
  )
}
