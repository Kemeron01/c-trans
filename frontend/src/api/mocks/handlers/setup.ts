import { delay, http, HttpResponse } from 'msw'
import { rangesOverlap } from '@/lib/pricing'
import { API_URL } from '../../config'
import { type SettingsPayload } from '../../setup'
import { type WeightRange } from '../../types'
import { courierTariffs, nextId, RATE_UZS, settings, tariffs } from '../db'
import {
  badRequest,
  belongsTo,
  forbidden,
  guard,
  MANAGERS,
  notFound,
  scopedWarehouse,
  STAFF,
} from '../utils'

function checkRange<T extends WeightRange & { id?: number }>(
  range: WeightRange,
  siblings: T[],
  selfId?: number
) {
  if (range.weight_to !== null && range.weight_to <= range.weight_from) {
    return badRequest('Верхняя граница веса должна быть больше нижней.')
  }
  if (siblings.some((t) => t.id !== selfId && rangesOverlap(t, range))) {
    return badRequest('Диапазон пересекается с существующим.')
  }
  return null
}

export const setupHandlers = [
  http.get(`${API_URL}/rates/usd/`, async ({ request }) => {
    const { error } = guard(request, [...STAFF, 'client'])
    return (
      error ??
      HttpResponse.json({
        currency: 'UZS',
        rate: RATE_UZS,
        date: new Date().toISOString().slice(0, 10),
      })
    )
  }),

  http.get(
    `${API_URL}/warehouses/:id/settings/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, [...STAFF])
      if (error) return error
      const id = Number(params.id)
      if (!belongsTo(user, id)) return forbidden()
      const s = settings.find((x) => x.warehouse_id === id)
      return s ? HttpResponse.json(s) : notFound()
    }
  ),

  http.put(
    `${API_URL}/warehouses/:id/settings/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, [...MANAGERS])
      if (error) return error
      const id = Number(params.id)
      if (!belongsTo(user, id)) return forbidden()
      const data = (await request.json()) as SettingsPayload
      let s = settings.find((x) => x.warehouse_id === id)
      if (!s) settings.push((s = { warehouse_id: id, ...data }))
      Object.assign(s, data)
      return HttpResponse.json(s)
    }
  ),

  // Delivery tariffs (foreign warehouses) and courier tariffs (local ones)
  ...rangeCrud('tariffs', tariffs, (t) =>
    tariffs.filter(
      (x) => x.warehouse_id === t.warehouse_id && x.method === t.method
    )
  ),
  ...rangeCrud('courier-tariffs', courierTariffs, (t) =>
    courierTariffs.filter((x) => x.warehouse_id === t.warehouse_id)
  ),
]

type RangeItem = WeightRange & { id: number; warehouse_id: number }

/** CRUD for weight-range price lists, with range validation. */
function rangeCrud<T extends RangeItem>(
  path: string,
  items: T[],
  siblingsOf: (item: Omit<T, 'id'>) => T[]
) {
  return [
    http.get(`${API_URL}/${path}/`, async ({ request }) => {
      await delay()
      const { user, error } = guard(request, [...STAFF])
      if (error) return error
      const warehouseId = scopedWarehouse(user, request)
      return HttpResponse.json(
        items.filter((t) => t.warehouse_id === warehouseId)
      )
    }),
    http.post(`${API_URL}/${path}/`, async ({ request }) => {
      await delay()
      const { user, error } = guard(request, [...MANAGERS])
      if (error) return error
      const data = (await request.json()) as Omit<T, 'id'>
      if (!belongsTo(user, data.warehouse_id)) return forbidden()
      const invalid = checkRange(data, siblingsOf(data))
      if (invalid) return invalid
      const created = { ...data, id: nextId(items) } as T
      items.push(created)
      return HttpResponse.json(created, { status: 201 })
    }),
    http.patch(`${API_URL}/${path}/:id/`, async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, [...MANAGERS])
      if (error) return error
      const item = items.find((t) => t.id === Number(params.id))
      if (!item) return notFound()
      if (!belongsTo(user, item.warehouse_id)) return forbidden()
      const next = { ...item, ...((await request.json()) as Partial<T>) }
      const invalid = checkRange(next, siblingsOf(next), item.id)
      if (invalid) return invalid
      Object.assign(item, next)
      return HttpResponse.json(item)
    }),
    http.delete(`${API_URL}/${path}/:id/`, async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, [...MANAGERS])
      if (error) return error
      const index = items.findIndex((t) => t.id === Number(params.id))
      if (index < 0) return notFound()
      if (!belongsTo(user, items[index].warehouse_id)) return forbidden()
      items.splice(index, 1)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}
