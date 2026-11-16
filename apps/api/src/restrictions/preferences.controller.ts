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
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { PersonId } from '../people/person-id.param.js'
import { PreferencesService } from './preferences.service.js'
import {
  type AddPreferenceRequest,
  addPreferenceSchema,
  PreferenceDto,
  type UpdatePreferenceRequest,
  updatePreferenceSchema,
} from './restrictions.dto.js'
import { PreferenceId } from './restrictions.errors.js'

@ApiTags('restrictions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@Controller('people')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @Get(':id/preferences')
  @ApiOkResponse({ type: PreferenceDto, isArray: true })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  list(@CurrentAccount() accountId: string, @PersonId() id: string) {
    return this.preferences.list(accountId, id)
  }

  @Post(':id/preferences')
  @ApiCreatedResponse({ type: PreferenceDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  @ApiConflictResponse({
    description: 'PREFERENCE_ALREADY_EXISTS or RESTRICTION_LIMIT_REACHED',
  })
  add(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @Body({ schema: addPreferenceSchema }) body: AddPreferenceRequest,
  ) {
    return this.preferences.add(accountId, id, body)
  }

  @Patch(':id/preferences/:preferenceId')
  @ApiOkResponse({ type: PreferenceDto })
  @ApiNotFoundResponse({
    description: 'PERSON_NOT_FOUND or PREFERENCE_NOT_FOUND',
  })
  updateRating(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @PreferenceId() preferenceId: string,
    @Body({ schema: updatePreferenceSchema }) body: UpdatePreferenceRequest,
  ) {
    return this.preferences.updateRating(accountId, id, preferenceId, body)
  }

  @Delete(':id/preferences/:preferenceId')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    description: 'PERSON_NOT_FOUND or PREFERENCE_NOT_FOUND',
  })
  async remove(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @PreferenceId() preferenceId: string,
  ) {
    await this.preferences.remove(accountId, id, preferenceId)
  }
}
