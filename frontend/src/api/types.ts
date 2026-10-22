/**
 * Domain types derived from docs/requirements.md.
 *
 * Temporary: once the Django backend publishes an OpenAPI schema these are
 * replaced by generated types. Field names are snake_case to match DRF output.
 * Each stage adds the entities it needs (countries, warehouses, orders, ...).
 */

export type Language = 'ru' | 'uz' | 'en'

/** Text stored in three languages (product names, countries, checkpoints). */
export type LocalizedText = Record<Language, string>

export type Role = 'super_admin' | 'admin' | 'worker' | 'client'
export type StaffRole = Exclude<Role, 'client'>

/** `foreign` — China / Russia / USA, `local` — Uzbekistan. */
export type WarehouseKind = 'foreign' | 'local'

/** Short warehouse info embedded in other objects (e.g. the current user). */
export type WarehouseSummary = {
  id: number
  name: string
  kind: WarehouseKind
  country_code: string
  city: string
}

/** Response of `GET /auth/me/`. */
export type CurrentUser = {
  id: number
  role: Role
  full_name: string
  phone: string | null
  email: string | null
  /** Staff only: login issued by an administrator. */
  username: string | null
  language: Language
  /** Admins and workers: the warehouse they belong to. Null for super_admin and clients. */
  warehouse: WarehouseSummary | null
  /** Clients only: personal code like `CT-12345`. */
  client_code: string | null
}

/** DRF-style error body: `{ detail }` or `{ field: [messages] }`. */
export type ApiErrorBody = {
  detail?: string
  [field: string]: unknown
}
