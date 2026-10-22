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

const locale = () => LOCALES[getLanguage()]

export function formatUsd(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function formatUzs(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat(locale(), {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, maxDigits = 2) {
  return new Intl.NumberFormat(locale(), {
    maximumFractionDigits: maxDigits,
  }).format(value)
}

/** "22.10.2026" */
export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(locale(), { dateStyle: 'short' }).format(
    new Date(value)
  )
}
