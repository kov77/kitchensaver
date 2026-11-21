import { en } from './en'
import { es } from './es'
import { fr } from './fr'

export const SUPPORTED_LOCALES = ['en', 'es', 'fr'] as const

export const DEFAULT_LOCALE = 'en'

export const DEFAULT_NAMESPACE = 'common'

export const RESOURCES = { en, es, fr }
