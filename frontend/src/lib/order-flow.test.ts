import { describe, expect, it } from 'vitest'
import { type CurrentUser, type Order } from '@/api/types'
import {
  canCancel,
  canReview,
  clientCanCancel,
  isOnSide,
  manualSteps,
  progressOf,
} from './order-flow'

const wh = (id: number, kind: 'foreign' | 'local') => ({
  id,
  name: `W${id}`,
  kind,
  country_code: kind === 'local' ? 'UZ' : 'CN',
  city: '',
})

const order = (patch: Partial<Order>): Order => ({
  id: 1,
  number: 'ORD-1',
  type: 'delivery',
  client: { id: 1, full_name: 'C', phone: '', client_code: 'CT-1' },
  origin_warehouse: wh(1, 'foreign'),
  destination_warehouse: wh(4, 'local'),
  method: 'auto',
  receive_method: 'pickup',
  delivery_address: null,
  status: 'paid',
  amounts: {
    goods_usd: 0,
    delivery_usd: 0,
    courier_usd: 0,
    total_usd: 0,
    rate_uzs: null,
    total_uzs: null,
    is_preliminary: false,
  },
  items: [],
  cargo: null,
  lead: null,
  shipment: null,
  review_id: null,
  history: [],
  created_at: '',
  ...patch,
})

const user = (role: CurrentUser['role'], warehouseId: number | null) =>
  ({
    id: 1,
    role,
    full_name: '',
    phone: null,
    email: null,
    username: '',
    language: 'ru',
    warehouse: warehouseId
      ? wh(warehouseId, warehouseId === 4 ? 'local' : 'foreign')
      : null,
    client_code: null,
  }) satisfies CurrentUser

describe('manualSteps', () => {
  it('assembles catalog orders but not delivery requests', () => {
    expect(manualSteps(order({ type: 'catalog' }))[0].to).toBe('assembling')
    expect(manualSteps(order({ type: 'delivery' }))[0].to).toBe('ready_to_ship')
  })

  it('follows the receive method after arrival', () => {
    const arrived = { status: 'arrived_uz' as const }
    expect(manualSteps(order(arrived))[0].to).toBe('ready_for_pickup')
    expect(
      manualSteps(order({ ...arrived, receive_method: 'courier' }))[0].to
    ).toBe('handed_to_courier')
  })

  it('has no manual steps in transit', () => {
    expect(manualSteps(order({ status: 'in_transit' }))).toEqual([])
  })
})

describe('sides and cancelling', () => {
  it('lets only staff of the matching warehouse act', () => {
    const o = order({})
    expect(isOnSide(user('worker', 1), o, 'origin')).toBe(true)
    expect(isOnSide(user('worker', 4), o, 'origin')).toBe(false)
    expect(isOnSide(user('worker', 4), o, 'destination')).toBe(true)
    expect(isOnSide(user('super_admin', null), o, 'destination')).toBe(true)
  })

  it('allows cancel for origin admin until the order is in a shipment', () => {
    expect(canCancel(user('admin', 1), order({}))).toBe(true)
    expect(canCancel(user('worker', 1), order({}))).toBe(false)
    expect(
      canCancel(
        user('admin', 1),
        order({ shipment: { id: 1, number: 'SH-1' } })
      )
    ).toBe(false)
    expect(canCancel(user('admin', 1), order({ status: 'in_transit' }))).toBe(
      false
    )
  })
})

describe('progressOf', () => {
  it('maps intermediate statuses onto visible steps', () => {
    const p = progressOf(order({ status: 'ready_for_pickup' }))
    expect(p.steps[p.current]).toBe('arrived_uz')
    expect(p.stopped).toBe(false)
    expect(
      progressOf(order({ type: 'catalog', status: 'awaiting_payment' })).current
    ).toBe(0)
  })

  it('shows where a cancelled order stopped', () => {
    const p = progressOf(
      order({
        status: 'cancelled',
        history: [
          { status: 'lead_new', changed_by: null, at: '', comment: '' },
          { status: 'awaiting_arrival', changed_by: null, at: '', comment: '' },
          { status: 'cancelled', changed_by: null, at: '', comment: '' },
        ],
      })
    )
    expect(p.steps[p.current]).toBe('awaiting_arrival')
    expect(p.stopped).toBe(true)
  })
})

describe('client rules', () => {
  it('lets the client cancel only before payment / receiving', () => {
    expect(clientCanCancel(order({ status: 'awaiting_arrival' }))).toBe(true)
    expect(clientCanCancel(order({ status: 'paid' }))).toBe(false)
  })

  it('allows one review after delivery', () => {
    expect(canReview(order({ status: 'delivered' }))).toBe(true)
    expect(canReview(order({ status: 'delivered', review_id: 5 }))).toBe(false)
    expect(canReview(order({ status: 'in_transit' }))).toBe(false)
  })
})
