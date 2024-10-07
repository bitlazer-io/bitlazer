import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import { ELanguages } from '@enums'

const resources = {
  [ELanguages.EN]: en,
}

i18n.use(initReactI18next).init({
  resources,
  lng: ELanguages.EN,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n

export const supportedLanguages = [ELanguages.EN]
