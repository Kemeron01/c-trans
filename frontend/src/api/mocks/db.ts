import {
  type Country,
  type CourierTariff,
  type CurrentUser,
  type LocalizedText,
  type Product,
  type StockMovement,
  type Tariff,
  type UserRequest,
  type Warehouse,
  type WarehouseSettings,
  type WarehouseSummary,
} from '../types'

// In-memory seed data for MSW. Lives only in the browser tab:
// a page reload resets it.

export const MOCK_PASSWORD = 'demo1234'

export const countries: Country[] = [
  {
    id: 1,
    code: 'CN',
    name: { ru: 'Китай', uz: 'Xitoy', en: 'China' },
    is_active: true,
  },
  {
    id: 2,
    code: 'RU',
    name: { ru: 'Россия', uz: 'Rossiya', en: 'Russia' },
    is_active: true,
  },
  {
    id: 3,
    code: 'US',
    name: { ru: 'США', uz: 'AQSh', en: 'USA' },
    is_active: true,
  },
  {
    id: 4,
    code: 'UZ',
    name: { ru: 'Узбекистан', uz: "O'zbekiston", en: 'Uzbekistan' },
    is_active: true,
  },
]

export const warehouses: Warehouse[] = [
  {
    id: 1,
    name: 'Гуанчжоу',
    kind: 'foreign',
    country_id: 1,
    city: 'Гуанчжоу',
    address: 'Baiyun District, 88',
    latitude: 23.1291,
    longitude: 113.2644,
    is_active: true,
  },
  {
    id: 2,
    name: 'Москва',
    kind: 'foreign',
    country_id: 2,
    city: 'Москва',
    address: 'ул. Складская, 5',
    latitude: 55.7558,
    longitude: 37.6173,
    is_active: true,
  },
  {
    id: 3,
    name: 'Нью-Йорк',
    kind: 'foreign',
    country_id: 3,
    city: 'Нью-Йорк',
    address: '120 Cargo St',
    latitude: 40.7128,
    longitude: -74.006,
    is_active: true,
  },
  {
    id: 4,
    name: 'Ташкент',
    kind: 'local',
    country_id: 4,
    city: 'Ташкент',
    address: 'ул. Логистическая, 12',
    latitude: 41.2995,
    longitude: 69.2401,
    is_active: true,
  },
]

export function warehouseSummary(id: number | null): WarehouseSummary | null {
  const w = warehouses.find((item) => item.id === id)
  if (!w) return null
  const country = countries.find((c) => c.id === w.country_id)
  return {
    id: w.id,
    name: w.name,
    kind: w.kind,
    country_code: country?.code ?? '',
    city: w.city,
  }
}

export type MockUser = Omit<CurrentUser, 'warehouse'> & {
  warehouse_id: number | null
  password: string
  is_active: boolean
  created_at: string
}

function staff(
  id: number,
  username: string,
  full_name: string,
  role: CurrentUser['role'],
  warehouse_id: number | null
): MockUser {
  return {
    id,
    role,
    full_name,
    username,
    phone: null,
    email: null,
    language: 'ru',
    warehouse_id,
    client_code: null,
    password: MOCK_PASSWORD,
    is_active: true,
    created_at: '2026-10-01T09:00:00Z',
  }
}

export const users: MockUser[] = [
  staff(1, 'superadmin', 'Супер Админ', 'super_admin', null),
  staff(2, 'admin.china', 'Ли Вэй', 'admin', 1),
  staff(3, 'worker.china', 'Чжан Мин', 'worker', 1),
  staff(4, 'admin.tashkent', 'Азиз Каримов', 'admin', 4),
  staff(5, 'worker.tashkent', 'Бобур Алиев', 'worker', 4),
]

/** Pending requests keep the password until approval creates the account. */
export const userRequests: (UserRequest & { password: string })[] = [
  {
    id: 1,
    role: 'worker',
    username: 'worker2.china',
    full_name: 'Ван Лэй',
    phone: '+86 138 0000 0000',
    email: null,
    warehouse: warehouseSummary(1)!,
    status: 'pending',
    requested_by: { id: 2, full_name: 'Ли Вэй' },
    created_at: '2026-10-20T10:15:00Z',
    reviewed_by: null,
    reviewed_at: null,
    reject_reason: null,
    password: MOCK_PASSWORD,
  },
]

export const nextId = (items: { id: number }[]) =>
  Math.max(0, ...items.map((i) => i.id)) + 1

export function toCurrentUser({
  password: _password,
  is_active: _isActive,
  created_at: _createdAt,
  warehouse_id,
  ...user
}: MockUser): CurrentUser {
  return { ...user, warehouse: warehouseSummary(warehouse_id) }
}

// Mock tokens just encode the user id.
export const tokenFor = (userId: number) => `mock-token-${userId}`

export function userFromAuthHeader(header: string | null) {
  const id = Number(header?.match(/^Bearer mock-token-(\d+)$/)?.[1])
  return users.find((u) => u.id === id && u.is_active)
}

// ---- Stage 2 seed ----

export const RATE_UZS = 12650

export const settings: WarehouseSettings[] = [1, 2, 3].map((warehouse_id) => ({
  warehouse_id,
  min_weight_kg: 1,
  volume_divisor: { avia: 6000, auto: 5000 },
}))

export const tariffs: Tariff[] = [
  {
    id: 1,
    warehouse_id: 1,
    method: 'auto',
    weight_from: 1,
    weight_to: 50,
    price_per_kg: 3.5,
  },
  {
    id: 2,
    warehouse_id: 1,
    method: 'auto',
    weight_from: 50,
    weight_to: 100,
    price_per_kg: 3,
  },
  {
    id: 3,
    warehouse_id: 1,
    method: 'auto',
    weight_from: 100,
    weight_to: null,
    price_per_kg: 2.5,
  },
  {
    id: 4,
    warehouse_id: 1,
    method: 'avia',
    weight_from: 1,
    weight_to: 20,
    price_per_kg: 9,
  },
  {
    id: 5,
    warehouse_id: 1,
    method: 'avia',
    weight_from: 20,
    weight_to: null,
    price_per_kg: 8,
  },
  {
    id: 6,
    warehouse_id: 2,
    method: 'auto',
    weight_from: 1,
    weight_to: null,
    price_per_kg: 2.8,
  },
  {
    id: 7,
    warehouse_id: 2,
    method: 'avia',
    weight_from: 1,
    weight_to: null,
    price_per_kg: 7,
  },
  {
    id: 8,
    warehouse_id: 3,
    method: 'avia',
    weight_from: 1,
    weight_to: null,
    price_per_kg: 12,
  },
]

export const courierTariffs: CourierTariff[] = [
  { id: 1, warehouse_id: 4, weight_from: 0, weight_to: 10, price: 3 },
  { id: 2, warehouse_id: 4, weight_from: 10, weight_to: 50, price: 6 },
  { id: 3, warehouse_id: 4, weight_from: 50, weight_to: null, price: 12 },
]

const product = (
  id: number,
  name: LocalizedText,
  price: number,
  dims: [number, number, number, number],
  quantity: number,
  reserved = 0
): Product => ({
  id,
  warehouse_id: 1,
  name,
  description: { ru: '', uz: '', en: '' },
  photo_url: null,
  price,
  weight_kg: dims[0],
  length_cm: dims[1],
  width_cm: dims[2],
  height_cm: dims[3],
  is_active: true,
  stock: { quantity, reserved },
})

export const products: Product[] = [
  product(
    1,
    {
      ru: 'Кроссовки беговые',
      uz: 'Yugurish krossovkalari',
      en: 'Running sneakers',
    },
    35,
    [1.2, 35, 22, 13],
    40,
    2
  ),
  product(
    2,
    { ru: 'Чехол для телефона', uz: 'Telefon g‘ilofi', en: 'Phone case' },
    2.5,
    [0.1, 18, 10, 2],
    500,
    5
  ),
  product(
    3,
    {
      ru: 'Настольная LED-лампа',
      uz: 'Stol LED chirog‘i',
      en: 'LED desk lamp',
    },
    14,
    [0.9, 40, 20, 15],
    60,
    3
  ),
]

export const stockMovements: StockMovement[] = [
  {
    id: 1,
    product_id: 1,
    kind: 'receipt',
    quantity: 42,
    reason: 'Поставка от фабрики',
    created_by: { id: 3, full_name: 'Чжан Мин' },
    created_at: '2026-10-10T08:00:00Z',
  },
  {
    id: 2,
    product_id: 1,
    kind: 'reserve',
    quantity: -2,
    reason: 'ORD-1004',
    created_by: { id: 3, full_name: 'Чжан Мин' },
    created_at: '2026-10-21T12:00:00Z',
  },
]
