import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/translations/constants'
import type { Locale } from '@/translations/types'

function isSupportedLocale(
  languageCode: string | null,
): languageCode is Locale {
  return SUPPORTED_LOCALES.some((locale) => locale === languageCode)
}

export function resolveLocale(languageCodes: readonly (string | null)[]) {
  return languageCodes.find(isSupportedLocale) ?? DEFAULT_LOCALE
}
