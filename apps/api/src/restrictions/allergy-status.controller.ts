import { Body, Controller, Put } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { PersonId } from '../people/person-id.param.js'
import { AllergyStatusService } from './allergy-status.service.js'
import {
  AllergyStatusDto,
  type SetAllergyStatusRequest,
  setAllergyStatusSchema,
} from './restrictions.dto.js'

@ApiTags('restrictions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@Controller('people')
export class AllergyStatusController {
  constructor(private readonly allergyStatus: AllergyStatusService) {}

  @Put(':id/allergy-status')
  @ApiOkResponse({ type: AllergyStatusDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  @ApiConflictResponse({ description: 'ALLERGIES_EXIST' })
  @ApiUnprocessableEntityResponse({
    description: 'VALIDATION_FAILED (warningAcknowledged must be true)',
  })
  set(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @Body({ schema: setAllergyStatusSchema }) body: SetAllergyStatusRequest,
  ) {
    return this.allergyStatus.set(accountId, id, body)
  }
}
