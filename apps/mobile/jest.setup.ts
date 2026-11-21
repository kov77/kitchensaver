import i18next from 'i18next'

import '@/translations/init'

beforeAll(async () => {
  await i18next.changeLanguage('en')
})
