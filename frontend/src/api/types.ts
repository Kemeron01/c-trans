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

// ---- Stage 1: reference data and staff management ----

export type Country = {
  id: number
  /** ISO 3166-1 alpha-2, e.g. CN */
  code: string
  name: LocalizedText
  is_active: boolean
}

export type Warehouse = {
  id: number
  name: string
  kind: WarehouseKind
  country_id: number
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  is_active: boolean
}

/** Person reference in other objects (who requested, who reviewed). */
export type UserRef = {
  id: number
  full_name: string
}

/** Admin or worker account as seen by the super-admin. */
export type StaffAccount = {
  id: number
  role: Exclude<StaffRole, 'super_admin'>
  username: string
  full_name: string
  phone: string | null
  email: string | null
  warehouse: WarehouseSummary | null
  is_active: boolean
  created_at: string
}

export type UserRequestStatus = 'pending' | 'approved' | 'rejected'

/**
 * An admin's request to create a worker account (requirements 2.3, 2.4).
 * The password is write-only: sent on create, never returned.
 */
export type UserRequest = {
  id: number
  role: 'worker'
  username: string
  full_name: string
  phone: string | null
  email: string | null
  warehouse: WarehouseSummary
  status: UserRequestStatus
  requested_by: UserRef
  created_at: string
  reviewed_by: UserRef | null
  reviewed_at: string | null
  reject_reason: string | null
}
