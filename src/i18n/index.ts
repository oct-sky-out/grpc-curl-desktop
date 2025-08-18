import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import ko from './locales/ko.json'
import ja from './locales/ja.json'

const resources = {
  en: { translation: en },
  ja: { translation: ja },
  ko: { translation: ko },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n