import { findRange, quoteDelivery, toUzs } from '@/lib/pricing'
import {
  type ClientRef,
  type Dimensions,
  type Order,
  type OrderStatus,
  type Shipment,
} from '../types'
import {
  courierTariffs,
  products,
  RATE_UZS,
  settings,
  tariffs,
  warehouseSummary,
} from './db'

// Orders and shipments seed (stage 3). Statuses cover every step so each
// screen has something to show.

export const clients: ClientRef[] = [
  {
    id: 101,
    full_name: 'Алишер Усманов',
    phone: '+998 90 123 45 67',
    client_code: 'CT-10234',
  },
  {
    id: 102,
    full_name: 'Дилноза Рахимова',
    phone: '+998 93 765 43 21',
    client_code: 'CT-10567',
  },
  {
    id: 103,
    full_name: 'Тимур Ахмедов',
    phone: '+998 97 111 22 33',
    client_code: 'CT-10891',
  },
]

/** Charged statuses: amounts are final and fixed in UZS. */
const CHARGED: OrderStatus[] = [
  'paid',
  'assembling',
  'ready_to_ship',
  'in_transit',
  'arrived_uz',
  'ready_for_pickup',
  'handed_to_courier',
  'delivered',
]

/** Weight/dimensions of a catalog order: summed over items. */
function catalogDimensions(order: Order): Dimensions {
  let weight = 0
  let volume = 0
  for (const item of order.items) {
    const p = products.find((x) => x.id === item.product_id)
    if (!p) continue
    weight += p.weight_kg * item.quantity
    volume += p.length_cm * p.width_cm * p.height_cm * item.quantity
  }
  // Total volume packed into one "length" so the shared formula applies
  return { weight_kg: weight, length_cm: volume, width_cm: 1, height_cm: 1 }
}

/** Recomputes amounts (and cargo weights) the way the backend would. */
export function recalculate(order: Order) {
  const s = settings.find((x) => x.warehouse_id === order.origin_warehouse.id)
  if (!s) return
  const dims =
    order.type === 'catalog'
      ? catalogDimensions(order)
      : (order.cargo!.actual ?? order.cargo!.declared)
  const quote = quoteDelivery({
    dimensions: dims,
    method: order.method,
    settings: s,
    tariffs,
  })
  if (order.cargo) {
    order.cargo.volume_weight = order.cargo.actual ? quote.volume_weight : null
    order.cargo.chargeable_weight = order.cargo.actual
      ? quote.chargeable_weight
      : null
  }
  const goods = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const courier =
    order.receive_method === 'courier'
      ? (findRange(
          courierTariffs.filter(
            (t) => t.warehouse_id === order.destination_warehouse.id
          ),
          quote.chargeable_weight
        )?.price ?? 0)
      : 0
  const total =
    Math.round((goods + (quote.delivery_usd ?? 0) + courier) * 100) / 100
  const charged = CHARGED.includes(order.status)
  order.amounts = {
    goods_usd: goods,
    delivery_usd: quote.delivery_usd ?? 0,
    courier_usd: courier,
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
    history: [],
    ...o,
  }
  const first: OrderStatus = type === 'catalog' ? 'created' : 'lead_new'
  order.history = [
    { status: first, changed_by: null, at: o.created_at, comment: '' },
    ...(o.status !== first
      ? [{ status: o.status, changed_by: null, at: o.created_at, comment: '' }]
      : []),
  ]
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

const [c1, c2, c3] = clients

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
