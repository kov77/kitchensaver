import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { ConsentController } from './consent.controller.js'
import { ConsentGuard } from './consent.guard.js'
import { ConsentService } from './consent.service.js'

@Module({
  controllers: [ConsentController],
  providers: [ConsentService, { provide: APP_GUARD, useClass: ConsentGuard }],
  exports: [ConsentService],
})
export class ConsentModule {}
