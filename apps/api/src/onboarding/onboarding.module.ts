import { Module } from '@nestjs/common'

import { EntitlementsModule } from '../entitlements/entitlements.module.js'
import { NutritionGoalsModule } from '../nutrition-goals/nutrition-goals.module.js'
import { PeopleModule } from '../people/people.module.js'
import { RestrictionsModule } from '../restrictions/restrictions.module.js'
import { OnboardingController } from './onboarding.controller.js'
import { OnboardingService } from './onboarding.service.js'

@Module({
  imports: [
    EntitlementsModule,
    PeopleModule,
    NutritionGoalsModule,
    RestrictionsModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
