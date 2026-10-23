import { delay, http, HttpResponse } from 'msw'
import { canReview, clientCanCancel } from '@/lib/order-flow'
import { type ClientOrderPayload, type ReviewPayload } from '../../account'
import { API_URL } from '../../config'
import { type Order, type TrackingPoint } from '../../types'
import {
  countries,
  courierTariffs,
  type MockUser,
  nextId,
  products,
  settings,
  tariffs,
  toCurrentUser,
  tokenFor,
  users,
  warehouses,
  warehouseSummary,
} from '../db'
import { cards, MOCK_OTP, notifications, otpAttempts } from '../db-client'
import {
  clientRef,
  orderDimensions,
  orders,
  recalculate,
  reviews,
  shipments,
} from '../db-orders'
import {
  cancelStock,
  charge,
  pushStatus,
  reserveStock,
  scheduleAutoCharge,
} from '../lifecycle'
import { badRequest, fieldError, guard, notFound } from '../utils'

/** "+998 90 123-45-67" → "+998901234567"; null if not an Uzbek mobile number. */
function normalizePhone(raw: string) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  return /^998\d{9}$/.test(digits) ? `+${digits}` : null
}

const ownOrder = (user: MockUser, id: unknown) =>
  orders.find((o) => o.id === Number(id) && o.client.id === user.id)

function point(warehouseId: number): TrackingPoint {
  const w = warehouses.find((x) => x.id === warehouseId)!
  const country = countries.find((c) => c.id === w.country_id)
  const name = country?.name ?? { ru: w.name, uz: w.name, en: w.name }
  return {
    name: {
      ru: `${w.name}, ${name.ru}`,
      uz: `${w.name}, ${name.uz}`,
      en: `${w.name}, ${name.en}`,
    },
    latitude: w.latitude ?? 0,
    longitude: w.longitude ?? 0,
    at: null,
  }
}

export const clientHandlers = [
  // ---- Phone + SMS sign-in (section 9) ----
  http.post(`${API_URL}/auth/otp/request/`, async ({ request }) => {
    await delay()
    const phone = normalizePhone(
      ((await request.json()) as { phone: string }).phone
    )
    if (!phone)
      return fieldError('phone', 'Введите номер в формате +998 XX XXX XX XX.')
    otpAttempts.set(phone, 5)
    return HttpResponse.json({ resend_in: 60 })
  }),

  http.post(`${API_URL}/auth/otp/verify/`, async ({ request }) => {
    await delay()
    const body = (await request.json()) as { phone: string; code: string }
    const phone = normalizePhone(body.phone)
    const attempts = phone ? otpAttempts.get(phone) : undefined
    if (!phone || attempts === undefined) {
      return fieldError('code', 'Сначала запросите код.')
    }
    if (body.code !== MOCK_OTP) {
      if (attempts <= 1) {
        otpAttempts.delete(phone)
        return HttpResponse.json(
          { detail: 'Слишком много попыток. Запросите новый код.' },
          { status: 429 }
        )
      }
      otpAttempts.set(phone, attempts - 1)
      return fieldError('code', 'Неверный код.')
    }
    otpAttempts.delete(phone)

    let user = users.find((u) => u.role === 'client' && u.phone === phone)
    const isNew = !user
    if (!user) {
      const id = Math.max(100, nextId(users))
      user = {
        id,
        role: 'client',
        full_name: '',
        username: null,
        phone,
        email: null,
        language: 'ru',
        warehouse_id: null,
        client_code: `CT-${10000 + id}`,
        address: '',
        password: '',
        is_active: true,
        created_at: new Date().toISOString(),
      }
      users.push(user)
    }
    if (!user.is_active) {
      return HttpResponse.json(
        { detail: 'Account is blocked.' },
        { status: 403 }
      )
    }
    return HttpResponse.json({
      access: tokenFor(user.id),
      user: toCurrentUser(user),
      is_new: isNew,
    })
  }),

  // ---- Public data: no sign-in needed ----
  http.get(`${API_URL}/public/warehouses/`, async () => {
    await delay()
    return HttpResponse.json(
      warehouses
        .filter((w) => w.is_active)
        .map((w) => ({
          ...warehouseSummary(w.id)!,
          country: countries.find((c) => c.id === w.country_id)?.name ?? {
            ru: '',
            uz: '',
            en: '',
          },
          address: w.address,
          latitude: w.latitude,
          longitude: w.longitude,
        }))
    )
  }),

  http.get(`${API_URL}/public/warehouses/:id/pricing/`, async ({ params }) => {
    await delay()
    const id = Number(params.id)
    return HttpResponse.json({
      settings: settings.find((s) => s.warehouse_id === id) ?? null,
      tariffs: tariffs.filter((t) => t.warehouse_id === id),
      courier_tariffs: courierTariffs.filter((t) => t.warehouse_id === id),
    })
  }),

  http.get(`${API_URL}/public/products/`, async ({ request }) => {
    await delay()
    const id = Number(new URL(request.url).searchParams.get('warehouse'))
    return HttpResponse.json(
      products.filter((p) => p.warehouse_id === id && p.is_active)
    )
  }),

  // ---- Profile ----
  http.get(`${API_URL}/client/profile/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['client'])
    if (error) return error
    return HttpResponse.json({
      client_code: user.client_code,
      phone: user.phone,
      full_name: user.full_name,
      email: user.email,
      address: user.address,
    })
  }),

  http.patch(`${API_URL}/client/profile/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['client'])
    if (error) return error
    const data = (await request.json()) as Partial<MockUser>
    if (data.full_name !== undefined) user.full_name = data.full_name
    if (data.email !== undefined) user.email = data.email
    if (data.address !== undefined) user.address = data.address
    return HttpResponse.json({
      client_code: user.client_code,
      phone: user.phone,
      full_name: user.full_name,
      email: user.email,
      address: user.address,
    })
  }),

  // ---- Cards (sandbox tokenization) ----
  http.get(`${API_URL}/client/cards/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['client'])
    if (error) return error
    return HttpResponse.json(cards.filter((c) => c.user_id === user.id))
  }),

  http.post(`${API_URL}/client/cards/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['client'])
    if (error) return error
    const { number, expiry } = (await request.json()) as {
      number: string
      expiry: string
    }
    const digits = number.replace(/\D/g, '')
    if (digits.length !== 16)
      return fieldError('number', 'Номер карты — 16 цифр.')
    const [mm, yy] = expiry.split('/').map(Number)
    const now = new Date()
    const expired =
      !mm ||
      mm > 12 ||
      2000 + yy < now.getFullYear() ||
      (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)
    if (expired)
      return fieldError('expiry', 'Карта просрочена или срок указан неверно.')
    const own = cards.filter((c) => c.user_id === user.id)
    const card = {
      id: nextId(cards),
      user_id: user.id,
      mask: `${digits.slice(0, 4)} **** **** ${digits.slice(-4)}`,
      expiry,
      is_default: !own.some((c) => c.verified),
      verified: false,
    }
    cards.push(card)
    return HttpResponse.json(card, { status: 201 })
  }),

  http.post(
    `${API_URL}/client/cards/:id/verify/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, ['client'])
      if (error) return error
      const card = cards.find(
        (c) => c.id === Number(params.id) && c.user_id === user.id
      )
      if (!card) return notFound()
      const { code } = (await request.json()) as { code: string }
      if (code !== MOCK_OTP) return fieldError('code', 'Неверный код.')
      card.verified = true
      return HttpResponse.json(card)
    }
  ),

  http.post(
    `${API_URL}/client/cards/:id/default/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, ['client'])
      if (error) return error
      const card = cards.find(
        (c) => c.id === Number(params.id) && c.user_id === user.id
      )
      if (!card?.verified) return notFound()
      for (const c of cards)
        if (c.user_id === user.id) c.is_default = c.id === card.id
      return new HttpResponse(null, { status: 204 })
    }
  ),

  http.delete(`${API_URL}/client/cards/:id/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, ['client'])
    if (error) return error
    const index = cards.findIndex(
      (c) => c.id === Number(params.id) && c.user_id === user.id
    )
    if (index < 0) return notFound()
    const [removed] = cards.splice(index, 1)
    if (removed.is_default) {
      const next = cards.find((c) => c.user_id === user.id && c.verified)
      if (next) next.is_default = true
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // ---- Orders ----
  http.get(`${API_URL}/client/orders/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['client'])
    if (error) return error
    return HttpResponse.json(
      orders
        .filter((o) => o.client.id === user.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    )
  }),

  http.get(`${API_URL}/client/orders/:id/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, ['client'])
    if (error) return error
    const order = ownOrder(user, params.id)
    return order ? HttpResponse.json(order) : notFound()
  }),

  http.get(
    `${API_URL}/client/orders/:id/tracking/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, ['client'])
      if (error) return error
      const order = ownOrder(user, params.id)
      if (!order) return notFound()
      const shipment = shipments.find((s) => s.id === order.shipment?.id)
      return HttpResponse.json({
        origin: point(order.origin_warehouse.id),
        destination: point(order.destination_warehouse.id),
        checkpoints: (shipment?.checkpoints ?? []).map((c) => ({
          name: c.name,
          latitude: c.latitude,
          longitude: c.longitude,
          at: c.at,
        })),
        shipment_status: shipment?.status ?? null,
      })
    }
  ),

  http.post(`${API_URL}/client/orders/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['client'])
    if (error) return error
    if (!user.full_name) return badRequest('Заполните профиль перед заказом.')
    const data = (await request.json()) as ClientOrderPayload
    const origin = warehouseSummary(data.origin_warehouse_id)
    const destination = warehouseSummary(data.destination_warehouse_id)
    if (origin?.kind !== 'foreign' || destination?.kind !== 'local') {
      return badRequest('Неверный склад отправления или назначения.')
    }
    if (data.receive_method === 'courier' && !data.delivery_address?.trim()) {
      return fieldError('delivery_address', 'Укажите адрес доставки.')
    }

    const id = nextId(orders)
    const order: Order = {
      id,
      number: `ORD-${id}`,
      type: data.type,
      client: clientRef(user),
      origin_warehouse: origin,
      destination_warehouse: destination,
      method: data.method,
      receive_method: data.receive_method,
      delivery_address:
        data.receive_method === 'courier' ? data.delivery_address : null,
      status: data.type === 'catalog' ? 'created' : 'lead_new',
      amounts: undefined as never,
      items: [],
      cargo: null,
      lead: null,
      shipment: null,
      review_id: null,
      history: [],
      created_at: new Date().toISOString(),
    }

    if (data.type === 'catalog') {
      for (const line of data.items ?? []) {
        const p = products.find(
          (x) =>
            x.id === line.product_id &&
            x.warehouse_id === origin.id &&
            x.is_active
        )
        if (!p) return badRequest('Товар недоступен.')
        if (
          line.quantity < 1 ||
          line.quantity > p.stock.quantity - p.stock.reserved
        ) {
          return badRequest(`Недостаточно товара «${p.name.ru}» на складе.`)
        }
        order.items.push({
          product_id: p.id,
          name: p.name,
          quantity: line.quantity,
          price: p.price,
        })
      }
      if (!order.items.length) return badRequest('Корзина пуста.')
    } else {
      if (!data.cargo) return badRequest('Опишите груз.')
      order.cargo = {
        ...data.cargo,
        actual: null,
        volume_weight: null,
        chargeable_weight: null,
      }
      order.lead = { contacted: false, result: null, comment: '' }
    }

    recalculate(order)
    const s = settings.find((x) => x.warehouse_id === origin.id)
    const weight = orderDimensions(order)
    if (!order.amounts.delivery_usd) {
      return badRequest('Для такого веса или способа доставки нет тарифа.')
    }
    if (s && weight.weight_kg < s.min_weight_kg && order.type === 'delivery') {
      return badRequest(
        `Минимальный вес для этого склада — ${s.min_weight_kg} кг.`
      )
    }

    orders.push(order)
    pushStatus(order, order.status, null)
    if (order.type === 'catalog') {
      reserveStock(order)
      scheduleAutoCharge(order)
    }
    return HttpResponse.json(order, { status: 201 })
  }),

  http.post(
    `${API_URL}/client/orders/:id/cancel/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, ['client'])
      if (error) return error
      const order = ownOrder(user, params.id)
      if (!order) return notFound()
      if (!clientCanCancel(order))
        return badRequest('Этот заказ уже нельзя отменить.')
      cancelStock(order)
      pushStatus(order, 'cancelled', user, 'Отменён клиентом')
      return HttpResponse.json(order)
    }
  ),

  http.post(
    `${API_URL}/client/orders/:id/retry-payment/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, ['client'])
      if (error) return error
      const order = ownOrder(user, params.id)
      if (!order) return notFound()
      if (order.status !== 'awaiting_payment')
        return badRequest('Заказ не ожидает оплаты.')
      if (!charge(order))
        return badRequest('Списание не прошло. Проверьте карту.')
      return HttpResponse.json(order)
    }
  ),

  http.post(
    `${API_URL}/client/orders/:id/review/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, ['client'])
      if (error) return error
      const order = ownOrder(user, params.id)
      if (!order) return notFound()
      if (!canReview(order))
        return badRequest('Отзыв можно оставить один раз после доставки.')
      const data = (await request.json()) as ReviewPayload
      const valid = (r: { rating: number } | null) =>
        !!r && r.rating >= 1 && r.rating <= 5
      if (
        !valid(data.delivery) ||
        (order.type === 'catalog' && !valid(data.product))
      ) {
        return badRequest('Поставьте оценку от 1 до 5.')
      }
      const review = {
        id: nextId(reviews),
        order_id: order.id,
        order_number: order.number,
        order_type: order.type,
        client: order.client,
        warehouse: order.origin_warehouse,
        delivery: data.delivery,
        product: order.type === 'catalog' ? data.product : null,
        created_at: new Date().toISOString(),
      }
      reviews.push(review)
      order.review_id = review.id
      return new HttpResponse(null, { status: 201 })
    }
  ),

  // ---- Notifications (site channel; SMS is sent by the backend) ----
  http.get(`${API_URL}/client/notifications/`, async ({ request }) => {
    const { user, error } = guard(request, ['client'])
    if (error) return error
    return HttpResponse.json(
      notifications
        .filter((n) => n.user_id === user.id)
        .slice(-50)
        .reverse()
    )
  }),

  http.post(`${API_URL}/client/notifications/read/`, async ({ request }) => {
    const { user, error } = guard(request, ['client'])
    if (error) return error
    for (const n of notifications) if (n.user_id === user.id) n.is_read = true
    return new HttpResponse(null, { status: 204 })
  }),
]
