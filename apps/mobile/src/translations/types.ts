import type { ParseKeys } from 'i18next'

import type { SUPPORTED_LOCALES } from './constants'
import type { en } from './en'

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export type CommonKey = `common:${ParseKeys<'common'>}`

export type TranslationKey = {
  [Namespace in keyof typeof en]: `${Namespace}:${ParseKeys<Namespace>}`
}[keyof typeof en]
