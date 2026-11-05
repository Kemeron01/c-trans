import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api } from './client'
import {
  type Dimensions,
  type LeadInfo,
  type ListParams,
  type Order,
  type OrderStatus,
  type Paginated,
} from './types'

export type LeadPayload = Partial<Pick<LeadInfo, 'contacted' | 'comment'>> & {
  /** agreed → awaiting_arrival, rejected → lead_rejected */
  result?: 'agreed' | 'rejected'
}

export const ordersApi = {
  /**
   * Orders visible to the user (their warehouse as origin or destination;
   * all for the super-admin), one page. Params: page, page_size, ordering
   * (`created_at`, `total_usd`; `-` = desc), search (number, client, phone,
   * tracking), status / type / method (`a,b`), shipment, origin_warehouse,
   * destination_warehouse, is_lead.
   */
  list: (params: ListParams) =>
    api.get<Paginated<Order>>('/orders/', { params }).then((r) => r.data),
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

export const ordersQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['orders', 'list', params],
    queryFn: () => ordersApi.list(params),
    placeholderData: keepPreviousData,
  })

export const orderQuery = (id: number) =>
  queryOptions({ queryKey: ['orders', id], queryFn: () => ordersApi.get(id) })
