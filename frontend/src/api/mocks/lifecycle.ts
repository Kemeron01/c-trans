import { type HistoryEvent, type Order, type OrderStatus } from '../types'
import { type MockUser, nextId, products, stockMovements } from './db'
import { cards, notifications } from './db-client'
import { orders, recalculate } from './db-orders'
import { persist } from './persist'

// Order side effects the backend performs: history, client notifications,
// automatic charging, stock reserve / write-off / return (5.1, 5.3, 10).

const SYSTEM = { id: 0, full_name: 'Система' }

function notify(order: Order, kind: 'order_status' | 'payment_failed') {
  notifications.push({
    id: nextId(notifications),
    user_id: order.client.id,
    kind,
    order_id: order.id,
    order_number: order.number,
    status: order.status,
    is_read: false,
    created_at: new Date().toISOString(),
  })
}

type PushOptions = {
  /** Free text written by a person. */
  comment?: string
  event?: HistoryEvent
  ref?: string
}

export function pushStatus(
  order: Order,
  status: OrderStatus,
  user: MockUser | null,
  { comment = '', event, ref }: PushOptions = {}
) {
  order.status = status
  order.history.push({
    status,
    event: event ?? null,
    ref: ref ?? null,
    changed_by: user && { id: user.id, full_name: user.full_name },
    at: new Date().toISOString(),
    comment,
  })
  notify(
    order,
    status === 'awaiting_payment' ? 'payment_failed' : 'order_status'
  )
}

function moveStock(
  order: Order,
  kind: 'reserve' | 'release' | 'write_off' | 'receipt',
  reason: string
) {
  for (const item of order.items) {
    const p = products.find((x) => x.id === item.product_id)
    if (!p) continue
    const q = item.quantity
    if (kind === 'reserve') p.stock.reserved += q
    if (kind === 'release') p.stock.reserved -= q
    if (kind === 'write_off') {
      p.stock.reserved -= q
      p.stock.quantity -= q
    }
    if (kind === 'receipt') p.stock.quantity += q
    stockMovements.push({
      id: nextId(stockMovements),
      product_id: p.id,
      kind,
      quantity: kind === 'receipt' || kind === 'release' ? q : -q,
      reason: `${order.number} · ${reason}`,
      created_by: SYSTEM,
      created_at: new Date().toISOString(),
    })
  }
}

/** Catalog order placed: goods are reserved. */
export const reserveStock = (order: Order) =>
  moveStock(order, 'reserve', 'резерв под заказ')

export function defaultCard(userId: number) {
  return cards.find((c) => c.user_id === userId && c.is_default && c.verified)
}

/**
 * Automatic charge from the client's default card (sandbox: succeeds when
 * the card exists). Failure → "Awaiting payment" + notification (5.3).
 */
export function charge(order: Order) {
  if (!defaultCard(order.client.id)) {
    pushStatus(order, 'awaiting_payment', null, { event: 'charge_failed' })
    return false
  }
  pushStatus(order, 'paid', null, { event: 'auto_charged' })
  if (order.type === 'catalog') moveStock(order, 'write_off', 'оплачен')
  recalculate(order) // fixes the UZS amount at the charge rate
  return true
}

const AUTO_CHARGE_MS = 20 * 1000
const scheduled = new Set<number>()

/**
 * Catalog orders are charged a few minutes after checkout (mock: 20 s).
 * The deadline is `created_at + 20 s`, so it survives a page reload:
 * see `resumeAutoCharges`.
 */
export function scheduleAutoCharge(order: Order) {
  if (scheduled.has(order.id)) return
  scheduled.add(order.id)
  const due = new Date(order.created_at).getTime() + AUTO_CHARGE_MS
  setTimeout(
    () => {
      scheduled.delete(order.id)
      if (order.status === 'created') {
        charge(order)
        persist()
      }
    },
    Math.max(0, due - Date.now())
  )
}

/**
 * Timers die with the page. On start, orders still waiting for their
 * automatic charge get a timer again (overdue ones are charged at once).
 */
export function resumeAutoCharges() {
  for (const order of orders) {
    if (order.type === 'catalog' && order.status === 'created') {
      scheduleAutoCharge(order)
    }
  }
}

/** Undo stock effects when an order is cancelled. */
export function cancelStock(order: Order) {
  if (order.type !== 'catalog') return
  if (['created', 'awaiting_payment'].includes(order.status)) {
    moveStock(order, 'release', 'отмена')
  } else if (['paid', 'assembling', 'ready_to_ship'].includes(order.status)) {
    moveStock(order, 'receipt', 'возврат на склад после отмены')
  }
}
