import type { NutritionInputErrorCode } from './types.js'

export class NutritionInputError extends Error {
  constructor(readonly code: NutritionInputErrorCode) {
    super(code)
  }
}
