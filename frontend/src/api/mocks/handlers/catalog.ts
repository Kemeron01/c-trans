import { delay, http, HttpResponse } from 'msw'
import { type ProductPayload, type StockMovementPayload } from '../../catalog'
import { API_URL } from '../../config'
import { nextId, products, stockMovements } from '../db'
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

export const catalogHandlers = [
  http.get(`${API_URL}/products/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, [...STAFF])
    if (error) return error
    const warehouseId = scopedWarehouse(user, request)
    return HttpResponse.json(
      products.filter((p) => p.warehouse_id === warehouseId)
    )
  }),

  http.post(`${API_URL}/products/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, [...MANAGERS])
    if (error) return error
    const data = (await request.json()) as ProductPayload
    if (!belongsTo(user, data.warehouse_id)) return forbidden()
    const product = {
      ...data,
      id: nextId(products),
      photo_url: null,
      stock: { quantity: 0, reserved: 0 },
    }
    products.push(product)
    return HttpResponse.json(product, { status: 201 })
  }),

  http.patch(`${API_URL}/products/:id/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...MANAGERS])
    if (error) return error
    const product = products.find((p) => p.id === Number(params.id))
    if (!product) return notFound()
    if (!belongsTo(user, product.warehouse_id)) return forbidden()
    Object.assign(product, (await request.json()) as Partial<ProductPayload>)
    return HttpResponse.json(product)
  }),

  http.post(`${API_URL}/products/:id/photo/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, [...MANAGERS])
    if (error) return error
    const product = products.find((p) => p.id === Number(params.id))
    if (!product) return notFound()
    if (!belongsTo(user, product.warehouse_id)) return forbidden()
    const file = (await request.formData()).get('photo')
    if (!(file instanceof File)) return badRequest('Файл не передан.')
    // Handlers run in the page, so an object URL works until reload
    product.photo_url = URL.createObjectURL(file)
    return HttpResponse.json(product)
  }),

  http.get(
    `${API_URL}/products/:id/stock-movements/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, [...STAFF])
      if (error) return error
      const product = products.find((p) => p.id === Number(params.id))
      if (!product) return notFound()
      if (!belongsTo(user, product.warehouse_id)) return forbidden()
      return HttpResponse.json(
        stockMovements
          .filter((m) => m.product_id === product.id)
          .slice()
          .reverse() // newest first
      )
    }
  ),

  http.post(
    `${API_URL}/products/:id/stock-movements/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, [...STAFF])
      if (error) return error
      const product = products.find((p) => p.id === Number(params.id))
      if (!product) return notFound()
      if (!belongsTo(user, product.warehouse_id)) return forbidden()
      const data = (await request.json()) as StockMovementPayload
      const delta =
        data.kind === 'receipt'
          ? Math.abs(data.quantity)
          : data.kind === 'write_off'
            ? -Math.abs(data.quantity)
            : data.quantity
      if (product.stock.quantity + delta < product.stock.reserved) {
        return badRequest('Остаток не может быть меньше зарезервированного.')
      }
      product.stock.quantity += delta
      const movement = {
        id: nextId(stockMovements),
        product_id: product.id,
        kind: data.kind,
        quantity: delta,
        reason: data.reason,
        created_by: { id: user.id, full_name: user.full_name },
        created_at: new Date().toISOString(),
      }
      stockMovements.push(movement)
      return HttpResponse.json(movement, { status: 201 })
    }
  ),
]
