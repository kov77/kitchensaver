import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { PersonId } from '../people/person-id.param.js'
import {
  type EstimateGoalRequest,
  estimateGoalSchema,
  GoalEstimateDto,
  NutritionGoalDto,
  type SaveGoalRequest,
  saveGoalSchema,
} from './nutrition-goals.dto.js'
import { NutritionGoalsService } from './nutrition-goals.service.js'

@ApiTags('nutrition-goals')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
@Controller('people')
export class NutritionGoalsController {
  constructor(private readonly goals: NutritionGoalsService) {}

  @Get(':id/goal')
  @ApiOkResponse({ type: NutritionGoalDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND or GOAL_NOT_FOUND' })
  get(@CurrentAccount() accountId: string, @PersonId() id: string) {
    return this.goals.get(accountId, id)
  }

  @Post(':id/goals/estimate')
  @HttpCode(200)
  @ApiOkResponse({ type: GoalEstimateDto })
  @ApiUnprocessableEntityResponse({
    description:
      'GOAL_TYPE_NOT_SUPPORTED_FOR_AGE, BODY_PARAMETERS_REQUIRED, GOAL_ESTIMATION_UNAVAILABLE or VALIDATION_FAILED',
  })
  estimate(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @Body({ schema: estimateGoalSchema }) body: EstimateGoalRequest,
  ) {
    return this.goals.estimate(accountId, id, body)
  }

  @Put(':id/goal')
  @ApiOkResponse({ type: NutritionGoalDto })
  @ApiUnprocessableEntityResponse({
    description:
      'GOAL_MACROS_MISMATCH, GOAL_TYPE_NOT_SUPPORTED_FOR_AGE, BODY_PARAMETERS_REQUIRED, GOAL_ESTIMATION_UNAVAILABLE or VALIDATION_FAILED',
  })
  save(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @Body({ schema: saveGoalSchema }) body: SaveGoalRequest,
  ) {
    return this.goals.save(accountId, id, body)
  }
}
