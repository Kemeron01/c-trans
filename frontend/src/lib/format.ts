import { getLanguage } from './i18n'

const LOCALES = { ru: 'ru-RU', uz: 'uz-Latn-UZ', en: 'en-GB' } as const

/** "22.10.2026, 14:05" in the interface language. */
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(LOCALES[getLanguage()], {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

/** Empty strings from optional inputs become null for the API. */
export const emptyToNull = (value: string) => value.trim() || null
