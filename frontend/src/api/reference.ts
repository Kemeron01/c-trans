import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import { type Country, type Warehouse } from './types'

// Countries and warehouses: small reference lists, returned without pagination.

export type CountryPayload = Omit<Country, 'id'>
export type WarehousePayload = Omit<Warehouse, 'id'>

export const countriesApi = {
  list: () => api.get<Country[]>('/countries/').then((r) => r.data),
  create: (data: CountryPayload) =>
    api.post<Country>('/countries/', data).then((r) => r.data),
  update: (id: number, data: Partial<CountryPayload>) =>
    api.patch<Country>(`/countries/${id}/`, data).then((r) => r.data),
}

export const warehousesApi = {
  list: () => api.get<Warehouse[]>('/warehouses/').then((r) => r.data),
  create: (data: WarehousePayload) =>
    api.post<Warehouse>('/warehouses/', data).then((r) => r.data),
  update: (id: number, data: Partial<WarehousePayload>) =>
    api.patch<Warehouse>(`/warehouses/${id}/`, data).then((r) => r.data),
}

export const countriesQuery = () =>
  queryOptions({ queryKey: ['countries'], queryFn: countriesApi.list })

export const warehousesQuery = () =>
  queryOptions({ queryKey: ['warehouses'], queryFn: warehousesApi.list })
