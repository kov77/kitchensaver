import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'

import { validateEnv } from './config/env.js'
import { AuthModule } from './auth/auth.module.js'
import { ApiExceptionFilter } from './common/api-exception.filter.js'
import { ConsentModule } from './consent/consent.module.js'
import { HealthController } from './health/health.controller.js'
import { MeModule } from './me/me.module.js'
import { NutritionGoalsModule } from './nutrition-goals/nutrition-goals.module.js'
import { OnboardingModule } from './onboarding/onboarding.module.js'
import { PeopleModule } from './people/people.module.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { RateLimitModule } from './rate-limit/rate-limit.module.js'
import { RestrictionsModule } from './restrictions/restrictions.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    RateLimitModule,
    ConsentModule,
    MeModule,
    PeopleModule,
    NutritionGoalsModule,
    RestrictionsModule,
    OnboardingModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class AppModule {}
