import type { ParseKeys } from 'i18next'

export const LEGAL_DOCUMENTS: readonly {
  id: string
  titleKey: ParseKeys<'consent'>
  bodyKey: ParseKeys<'consent'>
}[] = [
  { id: 'terms', titleKey: 'legal-terms-title', bodyKey: 'legal-terms-body' },
  {
    id: 'privacy',
    titleKey: 'legal-privacy-title',
    bodyKey: 'legal-privacy-body',
  },
]

export const CONSENT_CHECKBOXES: readonly {
  name: 'adultConfirmed' | 'acceptTerms' | 'acknowledgePrivacy'
  labelKey: ParseKeys<'consent'>
}[] = [
  { name: 'adultConfirmed', labelKey: 'adult-label' },
  { name: 'acceptTerms', labelKey: 'terms-label' },
  { name: 'acknowledgePrivacy', labelKey: 'privacy-label' },
]
