import { Body, Controller, Delete, Get, HttpCode, Post } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { PersonId } from '../people/person-id.param.js'
import { ExclusionsService } from './exclusions.service.js'
import {
  type AddExclusionRequest,
  addExclusionSchema,
  ExclusionDto,
} from './restrictions.dto.js'
import { ExclusionId } from './restrictions.errors.js'

@ApiTags('restrictions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@Controller('people')
export class ExclusionsController {
  constructor(private readonly exclusions: ExclusionsService) {}

  @Get(':id/exclusions')
  @ApiOkResponse({ type: ExclusionDto, isArray: true })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  list(@CurrentAccount() accountId: string, @PersonId() id: string) {
    return this.exclusions.list(accountId, id)
  }

  @Post(':id/exclusions')
  @ApiCreatedResponse({ type: ExclusionDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  @ApiConflictResponse({ description: 'EXCLUSION_ALREADY_EXISTS' })
  add(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @Body({ schema: addExclusionSchema }) body: AddExclusionRequest,
  ) {
    return this.exclusions.add(accountId, id, body)
  }

  @Delete(':id/exclusions/:exclusionId')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    description: 'PERSON_NOT_FOUND or EXCLUSION_NOT_FOUND',
  })
  async remove(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @ExclusionId() exclusionId: string,
  ) {
    await this.exclusions.remove(accountId, id, exclusionId)
  }
}
