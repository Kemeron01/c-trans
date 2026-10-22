import {
  type CurrentUser,
  type StaffRole,
  type WarehouseKind,
} from '@/api/types'

/** Admin panel sections: one sidebar item and one route each. */
export type Section =
  | 'dashboard'
  | 'leads'
  | 'orders'
  | 'shipments'
  | 'calculator'
  | 'tariffs'
  | 'courier_tariffs'
  | 'catalog'
  | 'workers'
  | 'clients'
  | 'reviews'
  | 'countries'
  | 'warehouses'
  | 'admins'
  | 'user_requests'

/**
 * `role` — any warehouse; `role:kind` — only staff of that warehouse kind.
 * A single `worker` role: what a worker can do depends on the warehouse kind.
 */
type Grant = StaffRole | `${'admin' | 'worker'}:${WarehouseKind}`

/**
 * Who can open which section (docs/requirements.md, sections 2 and 4.4).
 * Only controls the UI: the backend must enforce the same rules and limit
 * admins/workers to their own warehouse.
 */
const ACCESS: Record<Section, readonly Grant[]> = {
  dashboard: ['super_admin', 'admin'],
  leads: ['super_admin', 'admin:foreign'],
  orders: ['super_admin', 'admin', 'worker'],
  shipments: ['super_admin', 'admin', 'worker'],
  calculator: ['super_admin', 'admin:foreign', 'worker:foreign'],
  tariffs: ['super_admin', 'admin:foreign'],
  courier_tariffs: ['super_admin', 'admin:local'], // open question 4
  catalog: ['super_admin', 'admin:foreign', 'worker:foreign'],
  workers: ['admin'],
  clients: ['super_admin', 'admin'],
  reviews: ['super_admin', 'admin'],
  countries: ['super_admin'],
  warehouses: ['super_admin'],
  admins: ['super_admin'],
  user_requests: ['super_admin', 'admin'], // admin creates, super_admin reviews
}

export function isStaff(user: CurrentUser): boolean {
  return user.role !== 'client'
}

export function canAccess(user: CurrentUser, section: Section): boolean {
  return ACCESS[section].some((grant) => {
    const [role, kind] = grant.split(':')
    return user.role === role && (!kind || user.warehouse?.kind === kind)
  })
}
