import {
  type ArgumentMetadata,
  StandardSchemaValidationPipe,
} from '@nestjs/common'

import { ApiException } from './api-exception.js'

class FailClosedValidationPipe extends StandardSchemaValidationPipe {
  override transform<T>(value: T, metadata: ArgumentMetadata) {
    const needsSchema = metadata.type === 'body' || metadata.type === 'query'
    if (needsSchema && !metadata.schema) {
      throw new Error(
        `Missing validation schema for a ${metadata.type} parameter`,
      )
    }
    return super.transform(value, metadata)
  }
}

export function createValidationPipe() {
  return new FailClosedValidationPipe({
    exceptionFactory: (issues) =>
      new ApiException(422, 'VALIDATION_FAILED', 'Request validation failed', {
        fields: [
          ...new Set(
            issues.map(({ path = [] }) => path.join('.')).filter(Boolean),
          ),
        ],
      }),
  })
}
