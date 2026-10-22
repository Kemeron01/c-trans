import { en } from '@/locales/en'
import { ru } from '@/locales/ru'
import { uz } from '@/locales/uz'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { type Language } from '@/api/types'

export const LANGUAGES = ['ru', 'uz', 'en'] as const satisfies Language[]
export const DEFAULT_LANGUAGE: Language = 'ru'

const LANGUAGE_STORAGE_KEY = 'ct_lang'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof ru }
  }
}

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

function getStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // Storage may be unavailable (private mode, blocked site data)
  }
  return DEFAULT_LANGUAGE
}

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz: { translation: uz },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  initAsync: false,
  interpolation: { escapeValue: false }, // React already escapes
})

document.documentElement.lang = i18n.language

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
  } catch {
    // Ignore: language just won't persist
  }
})

export function getLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE
}

export default i18n
