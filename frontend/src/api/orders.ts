import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import {
  type Dimensions,
  type LeadInfo,
  type Order,
  type OrderStatus,
} from './types'

export type LeadPayload = Partial<Pick<LeadInfo, 'contacted' | 'comment'>> & {
  /** agreed → awaiting_arrival, rejected → lead_rejected */
  result?: 'agreed' | 'rejected'
}

export const ordersApi = {
  /**
   * Orders visible to the user: their warehouse as origin or destination;
   * all for the super-admin. Small volumes for now — will move to
   * server-side pagination and filtering when the backend is ready.
   */
  list: () => api.get<Order[]>('/orders/').then((r) => r.data),
  get: (id: number) => api.get<Order>(`/orders/${id}/`).then((r) => r.data),
  updateLead: (id: number, data: LeadPayload) =>
    api.post<Order>(`/orders/${id}/lead/`, data).then((r) => r.data),
  /** Cargo arrived and weighed: exact price + automatic charge. */
  weigh: (id: number, actual: Dimensions) =>
    api.post<Order>(`/orders/${id}/weigh/`, actual).then((r) => r.data),
  setStatus: (id: number, status: OrderStatus, comment = '') =>
    api
      .post<Order>(`/orders/${id}/status/`, { status, comment })
      .then((r) => r.data),
  cancel: (id: number, reason: string) =>
    api.post<Order>(`/orders/${id}/cancel/`, { reason }).then((r) => r.data),
}

export const ordersQuery = () =>
  queryOptions({ queryKey: ['orders'], queryFn: ordersApi.list })

export const orderQuery = (id: number) =>
  queryOptions({ queryKey: ['orders', id], queryFn: () => ordersApi.get(id) })
