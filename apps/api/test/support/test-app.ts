import { Test } from '@nestjs/testing'
import { onTestFinished } from 'vitest'

import { AppModule } from '../../src/app.module.js'
import { configureApp } from '../../src/app.setup.js'
import type { Env } from '../../src/config/env.js'

export async function createTestApp(nodeEnv: Env['NODE_ENV'] = 'test') {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()
  const app = moduleRef.createNestApplication()
  configureApp(app, nodeEnv)
  await app.init()
  onTestFinished(() => app.close())
  return app
}
