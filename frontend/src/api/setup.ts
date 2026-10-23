import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import {
  type CourierTariff,
  type ExchangeRate,
  type Tariff,
  type WarehouseSettings,
} from './types'

// Warehouse setup (stage 2). Admins only get their own warehouse; the
// `warehouse` query parameter matters for the super-admin.

export type TariffPayload = Omit<Tariff, 'id'>
export type CourierTariffPayload = Omit<CourierTariff, 'id'>
export type SettingsPayload = Omit<WarehouseSettings, 'warehouse_id'>

export const settingsApi = {
  get: (warehouseId: number) =>
    api
      .get<WarehouseSettings>(`/warehouses/${warehouseId}/settings/`)
      .then((r) => r.data),
  update: (warehouseId: number, data: SettingsPayload) =>
    api
      .put<WarehouseSettings>(`/warehouses/${warehouseId}/settings/`, data)
      .then((r) => r.data),
}

export const tariffsApi = {
  list: (warehouseId: number) =>
    api
      .get<Tariff[]>('/tariffs/', { params: { warehouse: warehouseId } })
      .then((r) => r.data),
  create: (data: TariffPayload) =>
    api.post<Tariff>('/tariffs/', data).then((r) => r.data),
  update: (id: number, data: Partial<TariffPayload>) =>
    api.patch<Tariff>(`/tariffs/${id}/`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/tariffs/${id}/`).then(() => undefined),
}

export const courierTariffsApi = {
  list: (warehouseId: number) =>
    api
      .get<CourierTariff[]>('/courier-tariffs/', {
        params: { warehouse: warehouseId },
      })
      .then((r) => r.data),
  create: (data: CourierTariffPayload) =>
    api.post<CourierTariff>('/courier-tariffs/', data).then((r) => r.data),
  update: (id: number, data: Partial<CourierTariffPayload>) =>
    api
      .patch<CourierTariff>(`/courier-tariffs/${id}/`, data)
      .then((r) => r.data),
  remove: (id: number) =>
    api.delete(`/courier-tariffs/${id}/`).then(() => undefined),
}

export const ratesApi = {
  /** Latest USD → UZS rate (backend caches cbu.uz daily). Public. */
  usd: () => api.get<ExchangeRate>('/rates/usd/').then((r) => r.data),
}

export const settingsQuery = (warehouseId: number) =>
  queryOptions({
    queryKey: ['warehouse-settings', warehouseId],
    queryFn: () => settingsApi.get(warehouseId),
  })

export const tariffsQuery = (warehouseId: number) =>
  queryOptions({
    queryKey: ['tariffs', warehouseId],
    queryFn: () => tariffsApi.list(warehouseId),
  })

export const courierTariffsQuery = (warehouseId: number) =>
  queryOptions({
    queryKey: ['courier-tariffs', warehouseId],
    queryFn: () => courierTariffsApi.list(warehouseId),
  })

export const rateQuery = () =>
  queryOptions({
    queryKey: ['rates', 'usd'],
    queryFn: ratesApi.usd,
    staleTime: 60 * 60 * 1000,
  })
