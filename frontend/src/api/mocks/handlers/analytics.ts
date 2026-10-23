import { delay, http, HttpResponse } from 'msw'
import { isActive } from '@/lib/order-flow'
import { API_URL } from '../../config'
import {
  type ClientSummary,
  type DashboardStats,
  type Order,
  type OrderStatus,
} from '../../types'
import { users } from '../db'
import { orders, reviews } from '../db-orders'
import { guard, MANAGERS, scopedWarehouse } from '../utils'

const touches = (o: Order, warehouseId: number | null) =>
  warehouseId === null ||
  o.origin_warehouse.id === warehouseId ||
  o.destination_warehouse.id === warehouseId

const day = (iso: string) => iso.slice(0, 10)

export const analyticsHandlers = [
  // Section 12: active orders now + orders and revenue for a period
  http.get(`${API_URL}/dashboard/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, [...MANAGERS])
    if (error) return error
    const url = new URL(request.url)
    const from = url.searchParams.get('from') ?? '0000-01-01'
    const to = url.searchParams.get('to') ?? '9999-12-31'
    const warehouseId = scopedWarehouse(user, request)
    const scoped = orders.filter((o) => touches(o, warehouseId))

    const active_by_status: Partial<Record<OrderStatus, number>> = {}
    for (const o of scoped.filter((x) => isActive(x.status))) {
      active_by_status[o.status] = (active_by_status[o.status] ?? 0) + 1
    }

    // Revenue belongs to the origin warehouse, on the day of the charge
    const charges = scoped
      .filter(
        (o) =>
          o.status !== 'cancelled' &&
          (warehouseId === null || o.origin_warehouse.id === warehouseId)
      )
      .flatMap((o) => {
        const paid = o.history.find((h) => h.status === 'paid')
        return paid ? [{ date: day(paid.at), order: o }] : []
      })
      .filter((c) => c.date >= from && c.date <= to)

    const series: DashboardStats['series'] = []
    for (
      let d = new Date(`${from}T00:00:00Z`);
      day(d.toISOString()) <= to && series.length < 400;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const date = day(d.toISOString())
      series.push({
        date,
        orders: scoped.filter((o) => day(o.created_at) === date).length,
        revenue_usd: charges
          .filter((c) => c.date === date)
          .reduce((sum, c) => sum + c.order.amounts.total_usd, 0),
      })
    }

    return HttpResponse.json<DashboardStats>({
      active_by_status,
      orders_count: scoped.filter(
        (o) => day(o.created_at) >= from && day(o.created_at) <= to
      ).length,
      revenue_usd:
        Math.round(
          charges.reduce((s, c) => s + c.order.amounts.total_usd, 0) * 100
        ) / 100,
      revenue_uzs: charges.reduce(
        (s, c) => s + (c.order.amounts.total_uzs ?? 0),
        0
      ),
      series,
    })
  }),

  http.get(`${API_URL}/clients/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, [...MANAGERS])
    if (error) return error
    const warehouseId = scopedWarehouse(user, request)
    const scoped = orders.filter((o) => touches(o, warehouseId))
    const result: ClientSummary[] = []
    for (const client of users.filter((u) => u.role === 'client')) {
      const own = scoped.filter((o) => o.client.id === client.id)
      if (!own.length) continue
      result.push({
        id: client.id,
        full_name: client.full_name,
        phone: client.phone ?? '',
        client_code: client.client_code ?? '',
        email: client.email,
        orders_count: own.length,
        active_orders: own.filter((o) => isActive(o.status)).length,
        total_usd:
          Math.round(
            own
              .filter(
                (o) => o.amounts.total_uzs !== null && o.status !== 'cancelled'
              )
              .reduce((s, o) => s + o.amounts.total_usd, 0) * 100
          ) / 100,
        last_order_at:
          own
            .map((o) => o.created_at)
            .sort()
            .reverse()[0] ?? null,
      })
    }
    return HttpResponse.json(result)
  }),

  http.get(`${API_URL}/reviews/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, [...MANAGERS])
    if (error) return error
    const warehouseId = scopedWarehouse(user, request)
    return HttpResponse.json(
      reviews
        .filter((r) => {
          const o = orders.find((x) => x.id === r.order_id)
          return o ? touches(o, warehouseId) : false
        })
        .slice()
        .reverse()
    )
  }),
]
