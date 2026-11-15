import { Module } from '@nestjs/common'

import { EntitlementsModule } from '../entitlements/entitlements.module.js'
import { PeopleController } from './people.controller.js'
import { PeopleService } from './people.service.js'

@Module({
  imports: [EntitlementsModule],
  controllers: [PeopleController],
  providers: [PeopleService],
})
export class PeopleModule {}
