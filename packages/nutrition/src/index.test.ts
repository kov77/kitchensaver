import { describe, expect, it } from 'vitest'

import { NUTRITION_PACKAGE_NAME } from './index'

describe('nutrition package', () => {
  it('exposes its name', () => {
    expect(NUTRITION_PACKAGE_NAME).toBe('@kitchensaver/nutrition')
  })
})
