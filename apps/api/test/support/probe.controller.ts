import { Body, Controller, Get, Post } from '@nestjs/common'

import { Public } from '../../src/auth/public.decorator.js'
import { AllowWithoutConsent } from '../../src/consent/allow-without-consent.decorator.js'

@Controller('probe')
export class ProbeController {
  @Get()
  protectedRoute() {
    return { ok: true }
  }

  @Get('exempt')
  @AllowWithoutConsent()
  exemptRoute() {
    return { ok: true }
  }

  @Get('public')
  @Public()
  publicRoute() {
    return { ok: true }
  }

  @Get('boom')
  @AllowWithoutConsent()
  boom() {
    throw new Error('secret-marker-1990-05-17')
  }

  @Post('unvalidated')
  @AllowWithoutConsent()
  unvalidated(@Body() body: unknown) {
    return body
  }
}
