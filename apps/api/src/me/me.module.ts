import { Module } from '@nestjs/common'

import { ConsentModule } from '../consent/consent.module.js'
import { MeController } from './me.controller.js'

@Module({ imports: [ConsentModule], controllers: [MeController] })
export class MeModule {}
