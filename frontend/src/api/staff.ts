import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import { type StaffAccount, type UserRequest } from './types'

export type AdminCreatePayload = {
  username: string
  password: string
  full_name: string
  phone: string | null
  email: string | null
  warehouse_id: number
}

export type AdminUpdatePayload = Partial<
  Omit<AdminCreatePayload, 'password' | 'username'> & { is_active: boolean }
>

/** Admin's request for a new worker; warehouse = the admin's own (set by backend). */
export type UserRequestPayload = {
  username: string
  password: string
  full_name: string
  phone: string | null
  email: string | null
}

export const adminsApi = {
  list: () => api.get<StaffAccount[]>('/admins/').then((r) => r.data),
  create: (data: AdminCreatePayload) =>
    api.post<StaffAccount>('/admins/', data).then((r) => r.data),
  update: (id: number, data: AdminUpdatePayload) =>
    api.patch<StaffAccount>(`/admins/${id}/`, data).then((r) => r.data),
  setPassword: (id: number, password: string) =>
    api.post(`/admins/${id}/set-password/`, { password }).then(() => undefined),
}

export const userRequestsApi = {
  /** super_admin: all requests; admin: own requests. */
  list: () => api.get<UserRequest[]>('/user-requests/').then((r) => r.data),
  create: (data: UserRequestPayload) =>
    api.post<UserRequest>('/user-requests/', data).then((r) => r.data),
  approve: (id: number) =>
    api.post<UserRequest>(`/user-requests/${id}/approve/`).then((r) => r.data),
  reject: (id: number, reason: string) =>
    api
      .post<UserRequest>(`/user-requests/${id}/reject/`, { reason })
      .then((r) => r.data),
}

export const adminsQuery = () =>
  queryOptions({ queryKey: ['admins'], queryFn: adminsApi.list })

export const userRequestsQuery = () =>
  queryOptions({ queryKey: ['user-requests'], queryFn: userRequestsApi.list })
