import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import { type DeliveryMethod, type LocalizedText, type Shipment } from './types'

export type ShipmentPayload = {
  method: DeliveryMethod
  destination_warehouse_id: number
  planned_departure: string
  planned_arrival: string
}

export type CheckpointPayload = {
  name: LocalizedText
  latitude: number
  longitude: number
  at: string
}

export const shipmentsApi = {
  list: () => api.get<Shipment[]>('/shipments/').then((r) => r.data),
  get: (id: number) =>
    api.get<Shipment>(`/shipments/${id}/`).then((r) => r.data),
  /** Origin = the worker's own foreign warehouse (set by backend). */
  create: (data: ShipmentPayload) =>
    api.post<Shipment>('/shipments/', data).then((r) => r.data),
  addOrders: (id: number, orderIds: number[]) =>
    api
      .post<Shipment>(`/shipments/${id}/orders/`, { order_ids: orderIds })
      .then((r) => r.data),
  removeOrder: (id: number, orderId: number) =>
    api
      .delete<Shipment>(`/shipments/${id}/orders/${orderId}/`)
      .then((r) => r.data),
  /** All orders → in_transit. */
  depart: (id: number) =>
    api.post<Shipment>(`/shipments/${id}/depart/`).then((r) => r.data),
  /** Uzbek warehouse accepts: orders → arrived_uz. */
  arrive: (id: number) =>
    api.post<Shipment>(`/shipments/${id}/arrive/`).then((r) => r.data),
  addCheckpoint: (id: number, data: CheckpointPayload) =>
    api
      .post<Shipment>(`/shipments/${id}/checkpoints/`, data)
      .then((r) => r.data),
}

export const shipmentsQuery = () =>
  queryOptions({ queryKey: ['shipments'], queryFn: shipmentsApi.list })

export const shipmentQuery = (id: number) =>
  queryOptions({
    queryKey: ['shipments', id],
    queryFn: () => shipmentsApi.get(id),
  })
