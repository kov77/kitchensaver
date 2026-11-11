import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { HealthResponseDto } from './health.dto.js'

@ApiTags('health')
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
