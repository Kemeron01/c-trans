import { delay, http, HttpResponse } from 'msw'
import {
  canCancel,
  isActive,
  isOnSide,
  LEAD_STATUSES,
  manualSteps,
  needsRefund,
} from '@/lib/order-flow'
import { API_URL } from '../../config'
import { type LeadPayload } from '../../orders'
import {
  type CurrentUser,
  type Dimensions,
  type Order,
  type OrderStatus,
} from '../../types'
import { settings, toCurrentUser, type MockUser } from '../db'
import { orders, RECALC_MESSAGES, recalculate } from '../db-orders'
import { cancelStock, charge, pushStatus } from '../lifecycle'
import {
  badRequest,
  forbidden,
  guard,
  notFound,
  paginate,
  STAFF,
} from '../utils'

/** Origin or destination is the user's warehouse; super-admin sees all. */
export const visibleTo = (user: MockUser, order: Order) =>
  user.role === 'super_admin' ||
  order.origin_warehouse.id === user.warehouse_id ||
  order.destination_warehouse.id === user.warehouse_id

function findOrder(user: MockUser, id: unknown) {
  const order = orders.find((o) => o.id === Number(id))
  return order && visibleTo(user, order) ? order : null
}

const LEAD_OPEN: OrderStatus[] = ['lead_new', 'lead_negotiation']

export const orderHandlers = [
  http.get(`${API_URL}/orders/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const q = new URL(request.url).searchParams
    const only = (param: string, get: (o: Order) => unknown) => {
      const v = q.get(param)
      return (o: Order) => !v || String(get(o)) === v
    }
    const isLead = (o: Order) =>
      o.type === 'delivery' &&
      (LEAD_STATUSES.includes(o.status) || !!o.lead?.result)
    const visible = orders.filter(
      (o) =>
        visibleTo(user, o) &&
        only('shipment', (x) => x.shipment?.id)(o) &&
        only('origin_warehouse', (x) => x.origin_warehouse.id)(o) &&
        only('destination_warehouse', (x) => x.destination_warehouse.id)(o) &&
        (q.get('is_lead') !== 'true' || isLead(o)) &&
        (q.get('active') !== 'true' || isActive(o.status))
    )
    return paginate(request, visible, {
      search: (o) =>
        [
          o.number,
          o.client.client_code,
          o.client.full_name,
          o.client.phone,
          ...(o.cargo?.tracking_numbers ?? []),
        ].join(' '),
      filters: {
        status: (o) => o.status,
        type: (o) => o.type,
        method: (o) => o.method,
      },
      ordering: {
        created_at: (o) => o.created_at,
        total_usd: (o) => o.amounts.total_usd,
        number: (o) => o.number,
      },
    })
  }),

  http.get(`${API_URL}/orders/:id/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const order = findOrder(user, params.id)
    return order ? HttpResponse.json(order) : notFound()
  }),

  http.post(`${API_URL}/orders/:id/lead/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, ['super_admin', 'admin'])
    if (error) return error
    const order = findOrder(user, params.id)
    if (!order?.lead) return notFound()
    if (!isOnSide(toCurrentUser(user), order, 'origin')) return forbidden()
    if (!LEAD_OPEN.includes(order.status)) {
      return badRequest('Лид уже закрыт.')
    }
    const data = (await request.json()) as LeadPayload
    if (data.comment !== undefined) order.lead.comment = data.comment
    if (data.contacted !== undefined) order.lead.contacted = data.contacted
    if (data.result === 'agreed') {
      order.lead.result = 'agreed'
      pushStatus(order, 'awaiting_arrival', user, {
        event: 'lead_agreed',
        comment: order.lead.comment,
      })
    } else if (data.result === 'rejected') {
      order.lead.result = 'rejected'
      pushStatus(order, 'lead_rejected', user, {
        event: 'lead_rejected',
        comment: order.lead.comment,
      })
    } else if (order.lead.contacted && order.status === 'lead_new') {
      pushStatus(order, 'lead_negotiation', user)
    }
    return HttpResponse.json(order)
  }),

  http.post(`${API_URL}/orders/:id/weigh/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const order = findOrder(user, params.id)
    if (!order?.cargo) return notFound()
    if (!isOnSide(toCurrentUser(user), order, 'origin')) return forbidden()
    if (order.status !== 'awaiting_arrival') {
      return badRequest('Груз этого заказа уже принят.')
    }
    const actual = (await request.json()) as Dimensions
    const previous = order.cargo.actual
    order.cargo.actual = actual
    const priceError = recalculate(order)
    if (priceError) {
      order.cargo.actual = previous
      return badRequest(RECALC_MESSAGES[priceError])
    }
    const min = settings.find(
      (s) => s.warehouse_id === order.origin_warehouse.id
    )?.min_weight_kg
    if (min !== undefined && (order.cargo.chargeable_weight ?? 0) < min) {
      order.cargo.actual = previous
      recalculate(order)
      return badRequest(`Расчётный вес ниже минимального (${min} кг).`)
    }
    pushStatus(order, 'received', user, { event: 'cargo_received' })
    // Exact price known: automatic charge from the client's card
    charge(order)
    return HttpResponse.json(order)
  }),

  http.post(`${API_URL}/orders/:id/status/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const order = findOrder(user, params.id)
    if (!order) return notFound()
    const { status, comment } = (await request.json()) as {
      status: OrderStatus
      comment: string
    }
    const step = manualSteps(order).find((s) => s.to === status)
    if (!step) return badRequest('Недопустимая смена статуса.')
    if (!isOnSide(toCurrentUser(user), order, step.side)) return forbidden()
    pushStatus(order, status, user, { comment })
    return HttpResponse.json(order)
  }),

  http.post(`${API_URL}/orders/:id/cancel/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, ['super_admin', 'admin'])
    if (error) return error
    const order = findOrder(user, params.id)
    if (!order) return notFound()
    const current: CurrentUser = toCurrentUser(user)
    if (!canCancel(current, order)) return forbidden()
    const { reason } = (await request.json()) as { reason: string }
    const refund = needsRefund(order)
    cancelStock(order)
    pushStatus(order, 'cancelled', user, {
      event: refund ? 'cancelled_with_refund' : 'cancelled_by_staff',
      comment: reason,
    })
    return HttpResponse.json(order)
  }),
]
