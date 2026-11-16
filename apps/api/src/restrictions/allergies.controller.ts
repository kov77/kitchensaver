import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
} from '@nestjs/common'
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
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { PersonId } from '../people/person-id.param.js'
import { AllergiesService } from './allergies.service.js'
import {
  type AddAllergyRequest,
  addAllergySchema,
  AllergyDto,
  type UpdateAllergyRequest,
  updateAllergySchema,
} from './restrictions.dto.js'
import { AllergyId } from './restrictions.errors.js'

@ApiTags('restrictions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@Controller('people')
export class AllergiesController {
  constructor(private readonly allergies: AllergiesService) {}

  @Get(':id/allergies')
  @ApiOkResponse({ type: AllergyDto, isArray: true })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  list(@CurrentAccount() accountId: string, @PersonId() id: string) {
    return this.allergies.list(accountId, id)
  }

  @Post(':id/allergies')
  @ApiCreatedResponse({ type: AllergyDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  @ApiConflictResponse({
    description: 'ALLERGY_ALREADY_EXISTS or RESTRICTION_LIMIT_REACHED',
  })
  add(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @Body({ schema: addAllergySchema }) body: AddAllergyRequest,
  ) {
    return this.allergies.add(accountId, id, body)
  }

  @Patch(':id/allergies/:allergyId')
  @ApiOkResponse({ type: AllergyDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND or ALLERGY_NOT_FOUND' })
  @ApiConflictResponse({ description: 'ALLERGY_ALREADY_EXISTS' })
  @ApiUnprocessableEntityResponse({
    description: 'ALLERGY_LABEL_NOT_APPLICABLE or VALIDATION_FAILED',
  })
  updateLabel(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @AllergyId() allergyId: string,
    @Body({ schema: updateAllergySchema }) body: UpdateAllergyRequest,
  ) {
    return this.allergies.updateLabel(accountId, id, allergyId, body)
  }

  @Delete(':id/allergies/:allergyId')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND or ALLERGY_NOT_FOUND' })
  async remove(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @AllergyId() allergyId: string,
  ) {
    await this.allergies.remove(accountId, id, allergyId)
  }
}
