import { useTranslation } from 'react-i18next'
import { type LocalizedText } from '@/api/types'
import { DEFAULT_LANGUAGE, getLanguage } from '@/lib/i18n'

/** Picks the current-language value of a LocalizedText (falls back to ru). */
export function useLocalized() {
  useTranslation() // re-render on language change
  const lang = getLanguage()
  return (text: LocalizedText | null | undefined) =>
    text ? text[lang] || text[DEFAULT_LANGUAGE] : ''
}
