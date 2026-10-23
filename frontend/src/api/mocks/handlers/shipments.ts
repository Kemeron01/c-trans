import { delay, http, HttpResponse } from 'msw'
import { API_URL } from '../../config'
import { type CheckpointPayload, type ShipmentPayload } from '../../shipments'
import { type Shipment } from '../../types'
import { nextId, type MockUser, warehouseSummary } from '../db'
import { orders, shipments } from '../db-orders'
import { pushStatus } from '../lifecycle'
import {
  badRequest,
  belongsTo,
  forbidden,
  guard,
  notFound,
  STAFF,
} from '../utils'

const visible = (user: MockUser, s: Shipment) =>
  user.role === 'super_admin' ||
  s.origin_warehouse.id === user.warehouse_id ||
  s.destination_warehouse.id === user.warehouse_id

function find(user: MockUser, id: unknown) {
  const s = shipments.find((x) => x.id === Number(id))
  return s && visible(user, s) ? s : null
}

export const shipmentHandlers = [
  http.get(`${API_URL}/shipments/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    return HttpResponse.json(
      shipments
        .filter((s) => visible(user, s))
        .slice()
        .reverse()
    )
  }),

  http.get(`${API_URL}/shipments/:id/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const s = find(user, params.id)
    return s ? HttpResponse.json(s) : notFound()
  }),

  // Created by staff of a foreign warehouse: origin = their warehouse
  http.post(`${API_URL}/shipments/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['admin', 'worker'])
    if (error) return error
    const origin = warehouseSummary(user.warehouse_id)
    if (origin?.kind !== 'foreign') return forbidden()
    const data = (await request.json()) as ShipmentPayload
    const destination = warehouseSummary(data.destination_warehouse_id)
    if (destination?.kind !== 'local') {
      return badRequest('Укажите склад назначения в Узбекистане.')
    }
    const id = nextId(shipments)
    const shipment: Shipment = {
      id,
      number: `SH-${String(id).padStart(3, '0')}`,
      method: data.method,
      origin_warehouse: origin,
      destination_warehouse: destination,
      status: 'forming',
      planned_departure: data.planned_departure,
      planned_arrival: data.planned_arrival,
      departed_at: null,
      arrived_at: null,
      order_ids: [],
      checkpoints: [],
    }
    shipments.push(shipment)
    return HttpResponse.json(shipment, { status: 201 })
  }),

  http.post(`${API_URL}/shipments/:id/orders/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const s = find(user, params.id)
    if (!s) return notFound()
    if (!belongsTo(user, s.origin_warehouse.id)) return forbidden()
    if (s.status !== 'forming') return badRequest('Отправка уже ушла.')
    const { order_ids } = (await request.json()) as { order_ids: number[] }
    for (const orderId of order_ids) {
      const o = orders.find((x) => x.id === orderId)
      if (
        !o ||
        o.status !== 'ready_to_ship' ||
        o.shipment ||
        o.origin_warehouse.id !== s.origin_warehouse.id ||
        o.destination_warehouse.id !== s.destination_warehouse.id ||
        o.method !== s.method
      ) {
        return badRequest(`Заказ ${o?.number ?? orderId} нельзя добавить.`)
      }
    }
    for (const orderId of order_ids) {
      orders.find((x) => x.id === orderId)!.shipment = {
        id: s.id,
        number: s.number,
      }
      s.order_ids.push(orderId)
    }
    return HttpResponse.json(s)
  }),

  http.delete(
    `${API_URL}/shipments/:id/orders/:orderId/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, [...STAFF])
      if (error) return error
      const s = find(user, params.id)
      if (!s) return notFound()
      if (!belongsTo(user, s.origin_warehouse.id)) return forbidden()
      if (s.status !== 'forming') return badRequest('Отправка уже ушла.')
      const orderId = Number(params.orderId)
      s.order_ids = s.order_ids.filter((x) => x !== orderId)
      const o = orders.find((x) => x.id === orderId)
      if (o) o.shipment = null
      return HttpResponse.json(s)
    }
  ),

  http.post(`${API_URL}/shipments/:id/depart/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const s = find(user, params.id)
    if (!s) return notFound()
    if (!belongsTo(user, s.origin_warehouse.id)) return forbidden()
    if (s.status !== 'forming') return badRequest('Отправка уже ушла.')
    if (!s.order_ids.length) return badRequest('В отправке нет заказов.')
    s.status = 'in_transit'
    s.departed_at = new Date().toISOString()
    for (const o of orders.filter((x) => s.order_ids.includes(x.id))) {
      pushStatus(o, 'in_transit', user, s.number)
    }
    return HttpResponse.json(s)
  }),

  http.post(`${API_URL}/shipments/:id/arrive/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const s = find(user, params.id)
    if (!s) return notFound()
    if (!belongsTo(user, s.destination_warehouse.id)) return forbidden()
    if (s.status !== 'in_transit') return badRequest('Отправка не в пути.')
    s.status = 'arrived'
    s.arrived_at = new Date().toISOString()
    for (const o of orders.filter((x) => s.order_ids.includes(x.id))) {
      pushStatus(o, 'arrived_uz', user, s.number)
    }
    return HttpResponse.json(s)
  }),

  http.post(
    `${API_URL}/shipments/:id/checkpoints/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, [...STAFF])
      if (error) return error
      const s = find(user, params.id)
      if (!s) return notFound()
      if (!belongsTo(user, s.origin_warehouse.id)) return forbidden()
      if (s.status !== 'in_transit') {
        return badRequest('Точки отмечаются только для отправки в пути.')
      }
      const data = (await request.json()) as CheckpointPayload
      s.checkpoints.push({
        ...data,
        id: nextId(shipments.flatMap((x) => x.checkpoints)),
        created_by: { id: user.id, full_name: user.full_name },
      })
      s.checkpoints.sort((a, b) => a.at.localeCompare(b.at))
      return HttpResponse.json(s)
    }
  ),
]
