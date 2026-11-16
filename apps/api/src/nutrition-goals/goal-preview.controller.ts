import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'

import {
  GoalEstimateDto,
  type PreviewGoalRequest,
  previewGoalSchema,
} from './nutrition-goals.dto.js'
import { NutritionGoalsService } from './nutrition-goals.service.js'

@ApiTags('nutrition-goals')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@Controller('people')
export class GoalPreviewController {
  constructor(private readonly goals: NutritionGoalsService) {}

  @Post('goals/estimate')
  @HttpCode(200)
  @ApiOkResponse({ type: GoalEstimateDto })
  @ApiUnprocessableEntityResponse({
    description:
      'PERSON_AGE_NOT_SUPPORTED, GOAL_TYPE_NOT_SUPPORTED_FOR_AGE, GOAL_ESTIMATION_UNAVAILABLE or VALIDATION_FAILED',
  })
  estimate(@Body({ schema: previewGoalSchema }) body: PreviewGoalRequest) {
    return this.goals.estimateForDateOfBirth(body)
  }
}
