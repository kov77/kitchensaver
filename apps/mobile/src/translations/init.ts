import { getLocales } from 'expo-localization'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resolveLocale } from '@/utils/locale'

import { DEFAULT_LOCALE, DEFAULT_NAMESPACE, RESOURCES } from './constants'

void i18next.use(initReactI18next).init({
  resources: RESOURCES,
  ns: Object.keys(RESOURCES.en),
  defaultNS: DEFAULT_NAMESPACE,
  keySeparator: false,
  lng: resolveLocale(getLocales().map(({ languageCode }) => languageCode)),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
  initAsync: false,
})
