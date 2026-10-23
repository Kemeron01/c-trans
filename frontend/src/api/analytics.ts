import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import { type ClientSummary, type DashboardStats, type Review } from './types'

export type DashboardParams = {
  from: string // YYYY-MM-DD
  to: string
  /** super-admin only; admins always get their own warehouse. */
  warehouse?: number
}

export const analyticsApi = {
  dashboard: (params: DashboardParams) =>
    api.get<DashboardStats>('/dashboard/', { params }).then((r) => r.data),
  clients: () => api.get<ClientSummary[]>('/clients/').then((r) => r.data),
  reviews: () => api.get<Review[]>('/reviews/').then((r) => r.data),
}

export const dashboardQuery = (params: DashboardParams) =>
  queryOptions({
    queryKey: ['dashboard', params],
    queryFn: () => analyticsApi.dashboard(params),
  })

export const clientsQuery = () =>
  queryOptions({ queryKey: ['clients'], queryFn: analyticsApi.clients })

export const reviewsQuery = () =>
  queryOptions({ queryKey: ['reviews'], queryFn: analyticsApi.reviews })
