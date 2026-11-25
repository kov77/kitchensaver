import i18next, { type TOptions } from 'i18next'

import type { TranslationKey } from '@/translations/types'

export function lazyMessage(key: TranslationKey, options: TOptions = {}) {
  return { error: () => i18next.t(key, options) }
}

export const REQUIRED_MESSAGE = lazyMessage('common:errors-required')

export function getRequiredMessage() {
  return i18next.t('common:errors-required')
}
