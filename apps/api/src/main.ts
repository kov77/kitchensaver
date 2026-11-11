import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'

import { configureApp } from './app.setup.js'
import { AppModule } from './app.module.js'
import type { Env } from './config/env.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get<ConfigService<Env, true>>(ConfigService)
  configureApp(app, config.get('NODE_ENV', { infer: true }))
  await app.listen(config.get('PORT', { infer: true }))
}

await bootstrap()
