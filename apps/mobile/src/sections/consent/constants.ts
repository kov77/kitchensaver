export const CONSENT_TEXT = {
  title: 'Before you start',
  subtitle:
    'KitchenSaver is an app for adults aged 18 and over. Please read and confirm the points below.',
  selfConfirmationNote: 'This is a self-confirmation, not an age check.',
  adultLabel: 'I am 18 or older',
  termsLabel: 'I accept the Terms of Service',
  privacyLabel: 'I have read the Privacy Policy',
  confirmationRequired: 'Please confirm to continue.',
  submit: 'Continue',
  logOut: 'Log out',
} as const

export const LEGAL_DOCUMENTS = [
  {
    id: 'terms',
    title: 'Terms of Service',
    body: 'Placeholder text. The final Terms of Service will appear here before launch.',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: 'Placeholder text. The final Privacy Policy will appear here before launch.',
  },
] as const

export const CONSENT_CHECKBOXES = [
  { name: 'adultConfirmed', label: CONSENT_TEXT.adultLabel },
  { name: 'acceptTerms', label: CONSENT_TEXT.termsLabel },
  { name: 'acknowledgePrivacy', label: CONSENT_TEXT.privacyLabel },
] as const
