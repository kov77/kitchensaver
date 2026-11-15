import { Module } from '@nestjs/common'

import { PeopleModule } from '../people/people.module.js'
import { BodyParametersController } from './body-parameters.controller.js'
import { BodyParametersService } from './body-parameters.service.js'
import { NutritionGoalsController } from './nutrition-goals.controller.js'
import { NutritionGoalsService } from './nutrition-goals.service.js'

@Module({
  imports: [PeopleModule],
  controllers: [NutritionGoalsController, BodyParametersController],
  providers: [NutritionGoalsService, BodyParametersService],
})
export class NutritionGoalsModule {}
