import { Body, Controller, Delete, Get, HttpCode, Put } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { PersonId } from '../people/person-id.param.js'
import { BodyParametersService } from './body-parameters.service.js'
import {
  BodyParametersDto,
  type BodyParametersRequest,
  bodyParametersSchema,
} from './nutrition-goals.dto.js'

@ApiTags('nutrition-goals')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@Controller('people')
export class BodyParametersController {
  constructor(private readonly bodyParameters: BodyParametersService) {}

  @Get(':id/body-parameters')
  @ApiOkResponse({ type: BodyParametersDto })
  @ApiNotFoundResponse({
    description: 'PERSON_NOT_FOUND or BODY_PARAMETERS_NOT_FOUND',
  })
  get(@CurrentAccount() accountId: string, @PersonId() id: string) {
    return this.bodyParameters.get(accountId, id)
  }

  @Put(':id/body-parameters')
  @ApiOkResponse({ type: BodyParametersDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  save(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @Body({ schema: bodyParametersSchema }) body: BodyParametersRequest,
  ) {
    return this.bodyParameters.save(accountId, id, body)
  }

  @Delete(':id/body-parameters')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    description: 'PERSON_NOT_FOUND or BODY_PARAMETERS_NOT_FOUND',
  })
  async remove(@CurrentAccount() accountId: string, @PersonId() id: string) {
    await this.bodyParameters.remove(accountId, id)
  }
}
