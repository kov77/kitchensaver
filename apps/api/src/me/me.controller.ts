import { Controller, Get } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { CurrentAccount } from '../auth/current-account.decorator.js'
import { MeResponseDto } from './me.dto.js'

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  @Get()
  @ApiOkResponse({ type: MeResponseDto, description: 'The current account' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  get(@CurrentAccount() accountId: string): MeResponseDto {
    return { id: accountId }
  }
}
