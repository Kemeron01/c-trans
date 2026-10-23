import { PROGRESS } from '@/lib/order-flow'
import { itemsDimensions, quoteOrder, toUzs } from '@/lib/pricing'
import {
  type ClientRef,
  type Dimensions,
  type Order,
  type OrderStatus,
  type Review,
  type Shipment,
} from '../types'
import {
  courierTariffs,
  type MockUser,
  products,
  RATE_UZS,
  settings,
  tariffs,
  users,
  warehouseSummary,
} from './db'

// Orders, shipments and reviews seed. Statuses cover every step so each
// screen has something to show; ~30 days of delivered orders feed the
// dashboard.

export const clientRef = (u: MockUser): ClientRef => ({
  id: u.id,
  full_name: u.full_name,
  phone: u.phone ?? '',
  client_code: u.client_code ?? '',
})

const [c1, c2, c3] = users.filter((u) => u.role === 'client').map(clientRef)

/** Charged statuses: amounts are final and fixed in UZS. */
export const CHARGED: OrderStatus[] = [
  'paid',
  'assembling',
  'ready_to_ship',
  'in_transit',
  'arrived_uz',
  'ready_for_pickup',
  'handed_to_courier',
  'delivered',
]

export function orderDimensions(order: Order): Dimensions {
  if (order.type === 'delivery') {
    return order.cargo!.actual ?? order.cargo!.declared
  }
  return itemsDimensions(
    order.items.flatMap((i) => {
      const product = products.find((p) => p.id === i.product_id)
      return product ? [{ product, quantity: i.quantity }] : []
    })
  )
}

/** Recomputes amounts (and cargo weights) the way the backend would. */
export function recalculate(order: Order) {
  const s = settings.find((x) => x.warehouse_id === order.origin_warehouse.id)
  if (!s) return
  const quote = quoteOrder({
    dimensions: orderDimensions(order),
    method: order.method,
    settings: s,
    tariffs,
    goodsUsd: order.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    courierTariffs:
      order.receive_method === 'courier'
        ? courierTariffs.filter(
            (t) => t.warehouse_id === order.destination_warehouse.id
          )
        : undefined,
  })
  if (order.cargo) {
    order.cargo.volume_weight = order.cargo.actual ? quote.volume_weight : null
    order.cargo.chargeable_weight = order.cargo.actual
      ? quote.chargeable_weight
      : null
  }
  const total = quote.total_usd ?? 0
  const charged = CHARGED.includes(order.status)
  order.amounts = {
    goods_usd: quote.goods_usd,
    delivery_usd: quote.delivery_usd ?? 0,
    courier_usd: quote.courier_usd,
    total_usd: total,
    rate_uzs: charged ? RATE_UZS : null,
    total_uzs: charged ? toUzs(total, RATE_UZS) : null,
    is_preliminary: order.type === 'delivery' && !order.cargo!.actual,
  }
}

const dims = (w: number, l: number, wd: number, h: number): Dimensions => ({
  weight_kg: w,
  length_cm: l,
  width_cm: wd,
  height_cm: h,
})

const HOUR = 60 * 60 * 1000

/** Status history along the lifecycle up to `status`, a few hours apart. */
function historyFor(order: Order) {
  const steps = PROGRESS[order.type]
  const target =
    order.status === 'lead_negotiation'
      ? 'lead_new'
      : order.status === 'ready_for_pickup' ||
          order.status === 'handed_to_courier'
        ? 'arrived_uz'
        : order.status
  const path = steps.includes(target)
    ? steps.slice(0, steps.indexOf(target) + 1)
    : [steps[0]]
  if (path[path.length - 1] !== order.status) path.push(order.status)
  const start = new Date(order.created_at).getTime()
  return path.map((status, i) => ({
    status,
    changed_by: null,
    at: new Date(start + i * 18 * HOUR).toISOString(),
    comment: status === 'paid' ? 'Автосписание с карты' : '',
  }))
}

type Seed = Partial<Order> & {
  id: number
  status: OrderStatus
  client: ClientRef
  created_at: string
}

function seed(o: Seed): Order {
  const type = o.type ?? 'delivery'
  const order: Order = {
    number: `ORD-${o.id}`,
    type,
    origin_warehouse: warehouseSummary(1)!,
    destination_warehouse: warehouseSummary(4)!,
    method: 'auto',
    receive_method: 'pickup',
    delivery_address: null,
    amounts: undefined as never,
    items: [],
    cargo: null,
    lead:
      type === 'delivery'
        ? { contacted: true, result: 'agreed', comment: '' }
        : null,
    shipment: null,
    review_id: null,
    history: [],
    ...o,
  }
  order.history = historyFor(order)
  recalculate(order)
  return order
}

const item = (productId: number, quantity: number) => {
  const p = products.find((x) => x.id === productId)!
  return { product_id: p.id, name: p.name, quantity, price: p.price }
}

const cargo = (
  description: string,
  tracking: string[],
  declared: Dimensions,
  actual: Dimensions | null = null
) => ({
  description,
  tracking_numbers: tracking,
  declared,
  actual,
  volume_weight: null,
  chargeable_weight: null,
})

export const orders: Order[] = [
  seed({
    id: 1001,
    status: 'lead_new',
    client: c1,
    method: 'avia',
    created_at: '2026-10-22T07:30:00Z',
    lead: { contacted: false, result: null, comment: '' },
    cargo: cargo('Одежда, 2 коробки', ['YT8812345601'], dims(3, 30, 20, 15)),
  }),
  seed({
    id: 1002,
    status: 'lead_negotiation',
    client: c2,
    receive_method: 'courier',
    delivery_address: 'Ташкент, Юнусабад 4-12',
    created_at: '2026-10-21T11:00:00Z',
    lead: {
      contacted: true,
      result: null,
      comment: 'Уточняет габариты у продавца',
    },
    cargo: cargo('Детская коляска', ['JD5566778899'], dims(40, 60, 40, 40)),
  }),
  seed({
    id: 1003,
    status: 'awaiting_arrival',
    client: c3,
    created_at: '2026-10-19T09:00:00Z',
    cargo: cargo(
      'Запчасти для авто',
      ['SF1029384756', 'SF1029384757'],
      dims(25, 50, 40, 30)
    ),
  }),
  seed({
    id: 1004,
    type: 'catalog',
    status: 'paid',
    client: c1,
    created_at: '2026-10-21T12:00:00Z',
    items: [item(1, 2)],
  }),
  seed({
    id: 1005,
    type: 'catalog',
    status: 'ready_to_ship',
    client: c2,
    receive_method: 'courier',
    delivery_address: 'Ташкент, Чиланзар 9-33',
    created_at: '2026-10-18T10:00:00Z',
    items: [item(3, 3), item(2, 5)],
  }),
  seed({
    id: 1006,
    status: 'ready_to_ship',
    client: c3,
    receive_method: 'courier',
    delivery_address: 'Ташкент, Мирабад 2-7',
    created_at: '2026-10-15T08:00:00Z',
    cargo: cargo(
      'Кухонная техника',
      ['YT7700112233'],
      dims(18, 50, 40, 40),
      dims(19.4, 52, 41, 40)
    ),
  }),
  seed({
    id: 1007,
    status: 'in_transit',
    client: c1,
    created_at: '2026-10-10T08:00:00Z',
    shipment: { id: 1, number: 'SH-001' },
    cargo: cargo(
      'Текстиль',
      ['YT6600998877'],
      dims(30, 60, 40, 40),
      dims(31, 60, 40, 42)
    ),
  }),
  seed({
    id: 1008,
    type: 'catalog',
    status: 'arrived_uz',
    client: c2,
    created_at: '2026-10-01T08:00:00Z',
    shipment: { id: 2, number: 'SH-002' },
    items: [item(1, 1)],
  }),
  seed({
    id: 1009,
    status: 'delivered',
    client: c3,
    created_at: '2026-09-28T08:00:00Z',
    shipment: { id: 2, number: 'SH-002' },
    review_id: 1,
    cargo: cargo(
      'Инструменты',
      ['SF5544332211'],
      dims(12, 40, 30, 30),
      dims(12.5, 40, 30, 30)
    ),
  }),
  seed({
    id: 1010,
    status: 'lead_new',
    client: c2,
    method: 'avia',
    created_at: '2026-10-22T06:00:00Z',
    origin_warehouse: warehouseSummary(2)!,
    lead: { contacted: false, result: null, comment: '' },
    cargo: cargo('Косметика', ['RU123456789'], dims(2, 30, 20, 10)),
  }),
]

// History for the dashboard: delivered orders over the last 30 days,
// deterministic so the chart is the same after every reset.
const DAY = 24 * HOUR
const today = new Date()
today.setHours(10, 0, 0, 0)
for (let i = 0; i < 26; i++) {
  const id = 900 + i
  const client = [c1, c2, c3][i % 3]
  const created = new Date(today.getTime() - (30 - i) * DAY - (i % 4) * HOUR)
  const weight = 4 + ((i * 7) % 30)
  orders.push(
    seed(
      i % 4 === 0
        ? {
            id,
            type: 'catalog',
            status: 'delivered',
            client,
            created_at: created.toISOString(),
            items: [item(1 + (i % 3), 1 + (i % 2))],
          }
        : {
            id,
            status: 'delivered',
            client,
            method: i % 5 === 0 ? 'avia' : 'auto',
            origin_warehouse: warehouseSummary(i % 6 === 1 ? 2 : 1)!,
            created_at: created.toISOString(),
            cargo: cargo(
              'Товары для дома',
              [`YT55${String(i).padStart(8, '0')}`],
              dims(weight, 40, 30, 30),
              dims(weight + 0.4, 40, 30, 30)
            ),
          }
    )
  )
}

const r = (rating: number, comment: string) => ({
  rating: rating as 1 | 2 | 3 | 4 | 5,
  comment,
})

function reviewFor(
  id: number,
  orderId: number,
  delivery: ReturnType<typeof r>,
  product: ReturnType<typeof r> | null
): Review {
  const o = orders.find((x) => x.id === orderId)!
  o.review_id = id
  return {
    id,
    order_id: o.id,
    order_number: o.number,
    order_type: o.type,
    client: o.client,
    warehouse: o.origin_warehouse,
    delivery,
    product: o.type === 'catalog' ? product : null,
    created_at: o.history[o.history.length - 1].at,
  }
}

export const reviews: Review[] = [
  reviewFor(1, 1009, r(5, 'Быстро и аккуратно, спасибо!'), null),
  reviewFor(
    2,
    900,
    r(4, 'Доставка заняла чуть дольше обещанного'),
    r(5, 'Кроссовки отличные')
  ),
  reviewFor(3, 902, r(3, 'Коробка помята'), null),
  reviewFor(4, 904, r(5, ''), r(4, 'Лампа хорошая, но провод короткий')),
]

const user = (id: number, full_name: string) => ({ id, full_name })

export const shipments: Shipment[] = [
  {
    id: 1,
    number: 'SH-001',
    method: 'auto',
    origin_warehouse: warehouseSummary(1)!,
    destination_warehouse: warehouseSummary(4)!,
    status: 'in_transit',
    planned_departure: '2026-10-16',
    planned_arrival: '2026-10-28',
    departed_at: '2026-10-16T06:00:00Z',
    arrived_at: null,
    order_ids: [1007],
    checkpoints: [
      {
        id: 1,
        name: {
          ru: 'Выехал из Гуанчжоу',
          uz: 'Guanchjoudan chiqdi',
          en: 'Left Guangzhou',
        },
        latitude: 23.1291,
        longitude: 113.2644,
        at: '2026-10-16T06:00:00Z',
        created_by: user(3, 'Чжан Мин'),
      },
      {
        id: 2,
        name: {
          ru: 'Граница Хоргос',
          uz: 'Xorgos chegarasi',
          en: 'Khorgos border',
        },
        latitude: 44.2117,
        longitude: 80.4106,
        at: '2026-10-21T14:00:00Z',
        created_by: user(3, 'Чжан Мин'),
      },
    ],
  },
  {
    id: 2,
    number: 'SH-002',
    method: 'auto',
    origin_warehouse: warehouseSummary(1)!,
    destination_warehouse: warehouseSummary(4)!,
    status: 'arrived',
    planned_departure: '2026-10-05',
    planned_arrival: '2026-10-17',
    departed_at: '2026-10-05T06:00:00Z',
    arrived_at: '2026-10-17T09:00:00Z',
    order_ids: [1008, 1009],
    checkpoints: [
      {
        id: 3,
        name: {
          ru: 'Выехал из Гуанчжоу',
          uz: 'Guanchjoudan chiqdi',
          en: 'Left Guangzhou',
        },
        latitude: 23.1291,
        longitude: 113.2644,
        at: '2026-10-05T06:00:00Z',
        created_by: user(3, 'Чжан Мин'),
      },
      {
        id: 4,
        name: { ru: 'Ташкент', uz: 'Toshkent', en: 'Tashkent' },
        latitude: 41.2995,
        longitude: 69.2401,
        at: '2026-10-17T09:00:00Z',
        created_by: user(5, 'Бобур Алиев'),
      },
    ],
  },
]
