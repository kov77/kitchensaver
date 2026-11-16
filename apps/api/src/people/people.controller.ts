import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
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
import {
  type CreatePersonRequest,
  createPersonSchema,
  type ListPeopleQuery,
  listPeopleQuerySchema,
  PersonDetailDto,
  PersonListItemDto,
  type UpdatePersonRequest,
  updatePersonSchema,
} from './people.dto.js'
import { PeopleService } from './people.service.js'
import { PersonId } from './person-id.param.js'

@ApiTags('people')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'CONSENT_REQUIRED' })
@Controller('people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  @ApiOkResponse({ type: PersonListItemDto, isArray: true })
  list(
    @CurrentAccount() accountId: string,
    @Query({ schema: listPeopleQuerySchema })
    { status = 'active' }: ListPeopleQuery,
  ) {
    return this.people.list(accountId, status)
  }

  @Post()
  @ApiCreatedResponse({ type: PersonDetailDto })
  @ApiUnprocessableEntityResponse({
    description: 'PERSON_AGE_NOT_SUPPORTED or VALIDATION_FAILED',
  })
  @ApiConflictResponse({
    description: 'PROFILE_LIMIT_REACHED or PROFILE_TOTAL_LIMIT_REACHED',
  })
  create(
    @CurrentAccount() accountId: string,
    @Body({ schema: createPersonSchema }) body: CreatePersonRequest,
  ) {
    return this.people.create(accountId, body)
  }

  @Get(':id')
  @ApiOkResponse({ type: PersonDetailDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  get(@CurrentAccount() accountId: string, @PersonId() id: string) {
    return this.people.get(accountId, id)
  }

  @Patch(':id')
  @ApiOkResponse({ type: PersonDetailDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  @ApiUnprocessableEntityResponse({
    description: 'PERSON_AGE_NOT_SUPPORTED or VALIDATION_FAILED',
  })
  update(
    @CurrentAccount() accountId: string,
    @PersonId() id: string,
    @Body({ schema: updatePersonSchema }) body: UpdatePersonRequest,
  ) {
    return this.people.update(accountId, id, body)
  }

  @Post(':id/archive')
  @HttpCode(200)
  @ApiOkResponse({ type: PersonDetailDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  archive(@CurrentAccount() accountId: string, @PersonId() id: string) {
    return this.people.archive(accountId, id)
  }

  @Post(':id/restore')
  @HttpCode(200)
  @ApiOkResponse({ type: PersonDetailDto })
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  @ApiConflictResponse({ description: 'PROFILE_LIMIT_REACHED' })
  restore(@CurrentAccount() accountId: string, @PersonId() id: string) {
    return this.people.restore(accountId, id)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'PERSON_NOT_FOUND' })
  async remove(@CurrentAccount() accountId: string, @PersonId() id: string) {
    await this.people.remove(accountId, id)
  }
}
