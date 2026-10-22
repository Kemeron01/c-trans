import { type CurrentUser, type WarehouseSummary } from '../types'

// In-memory seed data for MSW. Lives only in the browser tab:
// a page reload resets it.

export const MOCK_PASSWORD = 'demo1234'

export const warehouses: WarehouseSummary[] = [
  {
    id: 1,
    name: 'Гуанчжоу',
    kind: 'foreign',
    country_code: 'CN',
    city: 'Гуанчжоу',
  },
  {
    id: 2,
    name: 'Москва',
    kind: 'foreign',
    country_code: 'RU',
    city: 'Москва',
  },
  {
    id: 3,
    name: 'Нью-Йорк',
    kind: 'foreign',
    country_code: 'US',
    city: 'Нью-Йорк',
  },
  {
    id: 4,
    name: 'Ташкент',
    kind: 'local',
    country_code: 'UZ',
    city: 'Ташкент',
  },
]

type MockUser = CurrentUser & { password: string; is_active: boolean }

function staff(
  id: number,
  username: string,
  full_name: string,
  role: CurrentUser['role'],
  warehouseId: number | null
): MockUser {
  return {
    id,
    role,
    full_name,
    username,
    phone: null,
    email: null,
    language: 'ru',
    warehouse: warehouses.find((w) => w.id === warehouseId) ?? null,
    client_code: null,
    password: MOCK_PASSWORD,
    is_active: true,
  }
}

export const users: MockUser[] = [
  staff(1, 'superadmin', 'Супер Админ', 'super_admin', null),
  staff(2, 'admin.china', 'Ли Вэй', 'admin', 1),
  staff(3, 'worker.china', 'Чжан Мин', 'worker', 1),
  staff(4, 'admin.tashkent', 'Азиз Каримов', 'admin', 4),
  staff(5, 'worker.tashkent', 'Бобур Алиев', 'worker', 4),
]

export function toCurrentUser({
  password: _password,
  is_active: _isActive,
  ...user
}: MockUser): CurrentUser {
  return user
}

// Mock tokens just encode the user id.
export const tokenFor = (userId: number) => `mock-token-${userId}`

export function userFromAuthHeader(header: string | null) {
  const id = Number(header?.match(/^Bearer mock-token-(\d+)$/)?.[1])
  return users.find((u) => u.id === id && u.is_active)
}
