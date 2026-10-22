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

// ---- Stage 2: warehouse setup ----

export type DeliveryMethod = 'avia' | 'auto'

/** Weight range [weight_from, weight_to) in kg; weight_to = null means "and above". */
export type WeightRange = {
  weight_from: number
  weight_to: number | null
}

export type Tariff = WeightRange & {
  id: number
  warehouse_id: number
  method: DeliveryMethod
  price_per_kg: number // USD
}

export type CourierTariff = WeightRange & {
  id: number
  warehouse_id: number
  price: number // USD per order
}

/** Per foreign warehouse (requirements 3, 4.1). */
export type WarehouseSettings = {
  warehouse_id: number
  min_weight_kg: number
  volume_divisor: Record<DeliveryMethod, number>
}

export type Dimensions = {
  weight_kg: number
  length_cm: number
  width_cm: number
  height_cm: number
}

export type Product = Dimensions & {
  id: number
  warehouse_id: number
  name: LocalizedText
  description: LocalizedText
  photo_url: string | null
  price: number // USD
  is_active: boolean
  stock: { quantity: number; reserved: number }
}

export type StockMovementKind =
  | 'receipt'
  | 'write_off'
  | 'reserve'
  | 'release'
  | 'adjustment'

export type StockMovement = {
  id: number
  product_id: number
  kind: StockMovementKind
  /** Signed: + adds to stock, − removes. */
  quantity: number
  reason: string
  created_by: UserRef
  created_at: string
}

export type ExchangeRate = {
  currency: 'UZS'
  /** UZS for 1 USD (cbu.uz) */
  rate: number
  date: string
}

// ---- Stage 3: orders, leads, shipments ----

export type OrderType = 'catalog' | 'delivery'
export type ReceiveMethod = 'pickup' | 'courier'

export type OrderStatus =
  // delivery request (lead) stage
  | 'lead_new'
  | 'lead_negotiation'
  | 'lead_rejected'
  | 'awaiting_arrival'
  | 'received'
  // catalog order before payment
  | 'created'
  | 'awaiting_payment'
  // common
  | 'paid'
  | 'assembling'
  | 'ready_to_ship'
  | 'in_transit'
  | 'arrived_uz'
  | 'ready_for_pickup'
  | 'handed_to_courier'
  | 'delivered'
  | 'cancelled'

export type ClientRef = {
  id: number
  full_name: string
  phone: string
  client_code: string
}

export type OrderItem = {
  product_id: number
  name: LocalizedText
  quantity: number
  price: number // USD at the time of order
}

export type Cargo = {
  description: string
  tracking_numbers: string[]
  /** From the client, used for the preliminary price. */
  declared: Dimensions
  /** From the warehouse after weighing. */
  actual: Dimensions | null
  volume_weight: number | null
  chargeable_weight: number | null
}

export type LeadInfo = {
  contacted: boolean
  result: 'agreed' | 'rejected' | null
  comment: string
}

export type OrderAmounts = {
  goods_usd: number
  delivery_usd: number
  courier_usd: number
  total_usd: number
  /** Fixed at the moment of charging. */
  rate_uzs: number | null
  total_uzs: number | null
  /** Delivery requests before weighing: price from declared weight. */
  is_preliminary: boolean
}

export type StatusHistoryEntry = {
  status: OrderStatus
  changed_by: UserRef | null // null = system (auto charge)
  at: string
  comment: string
}

export type Order = {
  id: number
  number: string
  type: OrderType
  client: ClientRef
  origin_warehouse: WarehouseSummary
  destination_warehouse: WarehouseSummary
  method: DeliveryMethod
  receive_method: ReceiveMethod
  delivery_address: string | null
  status: OrderStatus
  amounts: OrderAmounts
  items: OrderItem[] // catalog orders
  cargo: Cargo | null // delivery requests
  lead: LeadInfo | null // delivery requests
  shipment: { id: number; number: string } | null
  history: StatusHistoryEntry[]
  created_at: string
}

export type ShipmentStatus = 'forming' | 'in_transit' | 'arrived'

export type Checkpoint = {
  id: number
  name: LocalizedText
  latitude: number
  longitude: number
  at: string
  created_by: UserRef
}

export type Shipment = {
  id: number
  number: string
  method: DeliveryMethod
  origin_warehouse: WarehouseSummary
  destination_warehouse: WarehouseSummary
  status: ShipmentStatus
  planned_departure: string // date YYYY-MM-DD
  planned_arrival: string
  departed_at: string | null
  arrived_at: string | null
  order_ids: number[]
  checkpoints: Checkpoint[]
}
