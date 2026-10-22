import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import { type Product, type StockMovement } from './types'

export type ProductPayload = Omit<Product, 'id' | 'photo_url' | 'stock'>

/** Manual stock operations; reserve/release happen automatically with orders. */
export type StockMovementPayload = {
  kind: 'receipt' | 'write_off' | 'adjustment'
  /** receipt / write_off: positive amount; adjustment: signed delta. */
  quantity: number
  reason: string
}

export const productsApi = {
  list: (warehouseId: number) =>
    api
      .get<Product[]>('/products/', { params: { warehouse: warehouseId } })
      .then((r) => r.data),
  create: (data: ProductPayload) =>
    api.post<Product>('/products/', data).then((r) => r.data),
  update: (id: number, data: Partial<ProductPayload>) =>
    api.patch<Product>(`/products/${id}/`, data).then((r) => r.data),
  uploadPhoto: (id: number, file: File) => {
    const body = new FormData()
    body.append('photo', file)
    return api.post<Product>(`/products/${id}/photo/`, body).then((r) => r.data)
  },
  movements: (id: number) =>
    api
      .get<StockMovement[]>(`/products/${id}/stock-movements/`)
      .then((r) => r.data),
  addMovement: (id: number, data: StockMovementPayload) =>
    api
      .post<StockMovement>(`/products/${id}/stock-movements/`, data)
      .then((r) => r.data),
}

export const productsQuery = (warehouseId: number) =>
  queryOptions({
    queryKey: ['products', warehouseId],
    queryFn: () => productsApi.list(warehouseId),
  })

export const movementsQuery = (productId: number) =>
  queryOptions({
    queryKey: ['stock-movements', productId],
    queryFn: () => productsApi.movements(productId),
  })
