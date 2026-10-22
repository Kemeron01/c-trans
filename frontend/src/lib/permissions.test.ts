import { describe, expect, it } from 'vitest'
import { type CurrentUser, type Role, type WarehouseKind } from '@/api/types'
import { canAccess, isStaff } from './permissions'

function user(role: Role, kind?: WarehouseKind): CurrentUser {
  return {
    id: 1,
    role,
    full_name: 'Test',
    phone: null,
    email: null,
    username: 'test',
    language: 'ru',
    warehouse: kind
      ? { id: 1, name: 'W', kind, country_code: 'CN', city: 'C' }
      : null,
    client_code: null,
  }
}

describe('canAccess', () => {
  it('gives super_admin the system sections', () => {
    const superAdmin = user('super_admin')
    for (const section of ['countries', 'warehouses', 'admins'] as const) {
      expect(canAccess(superAdmin, section)).toBe(true)
    }
    expect(canAccess(superAdmin, 'workers')).toBe(false)
  })

  it('limits warehouse-kind sections to the matching admin', () => {
    expect(canAccess(user('admin', 'foreign'), 'tariffs')).toBe(true)
    expect(canAccess(user('admin', 'local'), 'tariffs')).toBe(false)
    expect(canAccess(user('admin', 'local'), 'courier_tariffs')).toBe(true)
    expect(canAccess(user('admin', 'foreign'), 'courier_tariffs')).toBe(false)
  })

  it('splits worker capabilities by warehouse kind', () => {
    const foreignWorker = user('worker', 'foreign')
    const localWorker = user('worker', 'local')

    expect(canAccess(foreignWorker, 'catalog')).toBe(true)
    expect(canAccess(foreignWorker, 'calculator')).toBe(true)
    expect(canAccess(localWorker, 'catalog')).toBe(false)
    expect(canAccess(localWorker, 'calculator')).toBe(false)

    for (const worker of [foreignWorker, localWorker]) {
      expect(canAccess(worker, 'orders')).toBe(true)
      expect(canAccess(worker, 'shipments')).toBe(true)
      expect(canAccess(worker, 'dashboard')).toBe(false)
      expect(canAccess(worker, 'tariffs')).toBe(false)
    }
  })

  it('never opens admin sections to clients', () => {
    expect(isStaff(user('client'))).toBe(false)
    expect(canAccess(user('client'), 'orders')).toBe(false)
  })
})
