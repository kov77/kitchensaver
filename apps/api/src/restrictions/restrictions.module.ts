import { Module } from '@nestjs/common'

import { PeopleModule } from '../people/people.module.js'
import { AllergiesController } from './allergies.controller.js'
import { AllergiesService } from './allergies.service.js'
import { ExclusionsController } from './exclusions.controller.js'
import { ExclusionsService } from './exclusions.service.js'
import { PreferencesController } from './preferences.controller.js'
import { PreferencesService } from './preferences.service.js'

@Module({
  imports: [PeopleModule],
  controllers: [
    AllergiesController,
    ExclusionsController,
    PreferencesController,
  ],
  providers: [AllergiesService, ExclusionsService, PreferencesService],
})
export class RestrictionsModule {}
