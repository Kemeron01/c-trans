import { queryOptions } from '@tanstack/react-query'
import { type LoginResponse } from './auth'
import { api } from './client'
import {
  type AppNotification,
  type ClientProfile,
  type Dimensions,
  type Order,
  type OrderTracking,
  type PaymentCard,
  type Product,
  type PublicWarehouse,
  type RatedComment,
  type WarehousePricing,
} from './types'

// Client platform (stage 5). `/public/*` works without signing in.

export const publicApi = {
  warehouses: () =>
    api.get<PublicWarehouse[]>('/public/warehouses/').then((r) => r.data),
  pricing: (warehouseId: number) =>
    api
      .get<WarehousePricing>(`/public/warehouses/${warehouseId}/pricing/`)
      .then((r) => r.data),
  products: (warehouseId: number) =>
    api
      .get<Product[]>('/public/products/', {
        params: { warehouse: warehouseId },
      })
      .then((r) => r.data),
}

export const otpApi = {
  /** Sends an SMS code. */
  request: (phone: string) =>
    api
      .post<{ resend_in: number }>('/auth/otp/request/', { phone })
      .then((r) => r.data),
  /** New phone → account is created with a CT-… code (`is_new`). */
  verify: (phone: string, code: string) =>
    api
      .post<LoginResponse & { is_new: boolean }>('/auth/otp/verify/', {
        phone,
        code,
      })
      .then((r) => r.data),
}

export type ClientOrderPayload = {
  type: Order['type']
  origin_warehouse_id: number
  destination_warehouse_id: number
  method: Order['method']
  receive_method: Order['receive_method']
  delivery_address: string | null
  /** catalog */
  items?: { product_id: number; quantity: number }[]
  /** delivery request */
  cargo?: {
    description: string
    tracking_numbers: string[]
    declared: Dimensions
  }
}

export type ReviewPayload = {
  delivery: RatedComment
  product: RatedComment | null
}

export const clientApi = {
  profile: () => api.get<ClientProfile>('/client/profile/').then((r) => r.data),
  updateProfile: (
    data: Partial<Pick<ClientProfile, 'full_name' | 'email' | 'address'>>
  ) => api.patch<ClientProfile>('/client/profile/', data).then((r) => r.data),

  cards: () => api.get<PaymentCard[]>('/client/cards/').then((r) => r.data),
  /**
   * Sandbox flow of Payme Subscribe / Click Card Token: the provider sends an
   * SMS code, the card becomes usable after `verifyCard`.
   */
  addCard: (number: string, expiry: string) =>
    api
      .post<PaymentCard>('/client/cards/', { number, expiry })
      .then((r) => r.data),
  verifyCard: (id: number, code: string) =>
    api
      .post<PaymentCard>(`/client/cards/${id}/verify/`, { code })
      .then((r) => r.data),
  setDefaultCard: (id: number) =>
    api.post(`/client/cards/${id}/default/`).then(() => undefined),
  removeCard: (id: number) =>
    api.delete(`/client/cards/${id}/`).then(() => undefined),

  orders: () => api.get<Order[]>('/client/orders/').then((r) => r.data),
  order: (id: number) =>
    api.get<Order>(`/client/orders/${id}/`).then((r) => r.data),
  tracking: (id: number) =>
    api
      .get<OrderTracking>(`/client/orders/${id}/tracking/`)
      .then((r) => r.data),
  createOrder: (data: ClientOrderPayload) =>
    api.post<Order>('/client/orders/', data).then((r) => r.data),
  cancelOrder: (id: number) =>
    api.post<Order>(`/client/orders/${id}/cancel/`).then((r) => r.data),
  retryPayment: (id: number) =>
    api.post<Order>(`/client/orders/${id}/retry-payment/`).then((r) => r.data),
  review: (id: number, data: ReviewPayload) =>
    api.post(`/client/orders/${id}/review/`, data).then(() => undefined),

  notifications: () =>
    api.get<AppNotification[]>('/client/notifications/').then((r) => r.data),
  markRead: () => api.post('/client/notifications/read/').then(() => undefined),
}

export const publicWarehousesQuery = () =>
  queryOptions({
    queryKey: ['public', 'warehouses'],
    queryFn: publicApi.warehouses,
    staleTime: 5 * 60 * 1000,
  })

export const pricingQuery = (warehouseId: number) =>
  queryOptions({
    queryKey: ['public', 'pricing', warehouseId],
    queryFn: () => publicApi.pricing(warehouseId),
  })

export const publicProductsQuery = (warehouseId: number) =>
  queryOptions({
    queryKey: ['public', 'products', warehouseId],
    queryFn: () => publicApi.products(warehouseId),
  })

export const profileQuery = () =>
  queryOptions({ queryKey: ['client', 'profile'], queryFn: clientApi.profile })

export const cardsQuery = () =>
  queryOptions({ queryKey: ['client', 'cards'], queryFn: clientApi.cards })

export const clientOrdersQuery = () =>
  queryOptions({ queryKey: ['client', 'orders'], queryFn: clientApi.orders })

export const clientOrderQuery = (id: number) =>
  queryOptions({
    queryKey: ['client', 'orders', id],
    queryFn: () => clientApi.order(id),
  })

export const trackingQuery = (id: number) =>
  queryOptions({
    queryKey: ['client', 'orders', id, 'tracking'],
    queryFn: () => clientApi.tracking(id),
  })

export const notificationsQuery = () =>
  queryOptions({
    queryKey: ['client', 'notifications'],
    queryFn: clientApi.notifications,
    refetchInterval: 30 * 1000,
  })
