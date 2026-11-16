import { Module } from '@nestjs/common'

import { PeopleModule } from '../people/people.module.js'
import { GoalPreviewController } from './goal-preview.controller.js'
import { BodyParametersController } from './body-parameters.controller.js'
import { BodyParametersService } from './body-parameters.service.js'
import { NutritionGoalsController } from './nutrition-goals.controller.js'
import { NutritionGoalsService } from './nutrition-goals.service.js'

@Module({
  imports: [PeopleModule],
  controllers: [
    NutritionGoalsController,
    BodyParametersController,
    GoalPreviewController,
  ],
  providers: [NutritionGoalsService, BodyParametersService],
  exports: [NutritionGoalsService, BodyParametersService],
})
export class NutritionGoalsModule {}
