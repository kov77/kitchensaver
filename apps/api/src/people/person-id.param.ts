import { Param, ParseUUIDPipe } from '@nestjs/common'

import { personNotFound } from './people.errors.js'

export const PersonId = () =>
  Param('id', new ParseUUIDPipe({ exceptionFactory: personNotFound }))
