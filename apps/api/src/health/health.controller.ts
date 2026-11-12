import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { Public } from '../auth/public.decorator.js'
import { HealthResponseDto } from './health.dto.js'

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    type: HealthResponseDto,
    description: 'The API process is running',
  })
  check(): HealthResponseDto {
    return { status: 'ok' }
  }
}
