import { type CurrentUser, type Order, type OrderStatus } from '@/api/types'

// Order lifecycle, docs/requirements.md section 5. Shared by the UI (which
// buttons to show) and the mocks (which transitions to accept); the backend
// must enforce the same rules.
//
// Not listed here — happen through their own actions:
//   lead_* / awaiting_arrival  — lead result (Leads page)
//   awaiting_arrival → received → paid — weighing + automatic charge
//   ready_to_ship → in_transit — shipment departure
//   in_transit → arrived_uz   — shipment arrival

/** All statuses in lifecycle order (filters, legends). */
export const ORDER_STATUSES: OrderStatus[] = [
  'lead_new',
  'lead_negotiation',
  'lead_rejected',
  'awaiting_arrival',
  'received',
  'created',
  'awaiting_payment',
  'paid',
  'assembling',
  'ready_to_ship',
  'in_transit',
  'arrived_uz',
  'ready_for_pickup',
  'handed_to_courier',
  'delivered',
  'cancelled',
]

/** Which warehouse's staff performs a step. */
export type Side = 'origin' | 'destination'

type Step = { to: OrderStatus; side: Side }

export function manualSteps(order: Order): Step[] {
  switch (order.status) {
    case 'paid':
      return order.type === 'catalog'
        ? [{ to: 'assembling', side: 'origin' }]
        : [{ to: 'ready_to_ship', side: 'origin' }]
    case 'assembling':
      return [{ to: 'ready_to_ship', side: 'origin' }]
    case 'arrived_uz':
      return [
        order.receive_method === 'courier'
          ? { to: 'handed_to_courier', side: 'destination' }
          : { to: 'ready_for_pickup', side: 'destination' },
      ]
    case 'ready_for_pickup':
    case 'handed_to_courier':
      return [{ to: 'delivered', side: 'destination' }]
    default:
      return []
  }
}

/** Admin can cancel until the order leaves with a shipment (5.3). */
const CANCELLABLE: OrderStatus[] = [
  'lead_new',
  'lead_negotiation',
  'awaiting_arrival',
  'received',
  'created',
  'awaiting_payment',
  'paid',
  'assembling',
  'ready_to_ship',
]

export function isCancellable(order: Order) {
  return CANCELLABLE.includes(order.status) && !order.shipment
}

/** Money was charged: cancelling means a refund. */
export function needsRefund(order: Order) {
  return ['paid', 'assembling', 'ready_to_ship'].includes(order.status)
}

export function isOnSide(user: CurrentUser, order: Order, side: Side) {
  if (user.role === 'super_admin') return true
  const warehouse =
    side === 'origin' ? order.origin_warehouse : order.destination_warehouse
  return user.warehouse?.id === warehouse.id
}

export function canCancel(user: CurrentUser, order: Order) {
  return (
    isCancellable(order) &&
    (user.role === 'super_admin' ||
      (user.role === 'admin' && isOnSide(user, order, 'origin')))
  )
}

/** Steps of the progress bar the client will see (stage 5), per order type. */
export const PROGRESS: Record<Order['type'], OrderStatus[]> = {
  catalog: [
    'created',
    'paid',
    'assembling',
    'ready_to_ship',
    'in_transit',
    'arrived_uz',
    'delivered',
  ],
  delivery: [
    'lead_new',
    'awaiting_arrival',
    'received',
    'paid',
    'ready_to_ship',
    'in_transit',
    'arrived_uz',
    'delivered',
  ],
}

export const LEAD_STATUSES: OrderStatus[] = [
  'lead_new',
  'lead_negotiation',
  'lead_rejected',
]

/** Not delivered and not cancelled (dashboard "active orders", section 12). */
export const isActive = (status: OrderStatus) =>
  !['delivered', 'cancelled', 'lead_rejected'].includes(status)
