import type { BodyParameters } from '@/core/types'
import { parseDecimal } from '@/utils/numbers'

import type { BodyParametersValues } from './schemas'

export function toBodyParametersValues(
  parameters: BodyParameters | null,
): BodyParametersValues {
  if (!parameters) {
    return { heightCm: '', weightKg: '', activityLevel: null, formulaSex: null }
  }
  return {
    heightCm: String(parameters.heightCm),
    weightKg: String(parameters.weightKg),
    activityLevel: parameters.activityLevel,
    formulaSex: parameters.formulaSex,
  }
}

export function toBodyParameters({
  heightCm: heightText,
  weightKg: weightText,
  activityLevel,
  formulaSex,
}: BodyParametersValues): BodyParameters | null {
  const heightCm = parseDecimal(heightText)
  const weightKg = parseDecimal(weightText)
  if (
    heightCm === null ||
    weightKg === null ||
    activityLevel === null ||
    formulaSex === null
  ) {
    return null
  }
  return { heightCm, weightKg, activityLevel, formulaSex }
}
