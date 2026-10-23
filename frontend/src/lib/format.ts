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
    parseDate(value)
  )
}

/**
 * "YYYY-MM-DD" is a calendar date, not an instant: `new Date('2026-10-22')`
 * is UTC midnight and shows the previous day west of UTC. Parse it as local.
 */
export function parseDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(value)
}

/** Today as "YYYY-MM-DD" in the user's time zone (for <input type="date">). */
export function todayLocal() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
