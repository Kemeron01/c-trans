import { delay, http, HttpResponse } from 'msw'
import { API_URL } from '../../config'
import {
  type AdminCreatePayload,
  type AdminUpdatePayload,
  type UserRequestPayload,
} from '../../staff'
import { type StaffAccount, type UserRequest } from '../../types'
import {
  type MockUser,
  nextId,
  userRequests,
  users,
  warehouseSummary,
} from '../db'
import {
  belongsTo,
  fieldError,
  forbidden,
  guard,
  notFound,
  scopedWarehouse,
  usernameTaken,
} from '../utils'

function toStaffAccount(user: MockUser): StaffAccount {
  return {
    id: user.id,
    role: user.role as StaffAccount['role'],
    username: user.username ?? '',
    full_name: user.full_name,
    phone: user.phone,
    email: user.email,
    warehouse: warehouseSummary(user.warehouse_id),
    is_active: user.is_active,
    created_at: user.created_at,
  }
}

const withoutPassword = ({
  password: _password,
  ...request
}: UserRequest & { password: string }): UserRequest => request

export const staffHandlers = [
  http.get(`${API_URL}/admins/`, async ({ request }) => {
    await delay()
    const { error } = guard(request, ['super_admin'])
    if (error) return error
    return HttpResponse.json(
      users.filter((u) => u.role === 'admin').map(toStaffAccount)
    )
  }),

  http.post(`${API_URL}/admins/`, async ({ request }) => {
    await delay()
    const { error } = guard(request, ['super_admin'])
    if (error) return error
    const { warehouse_id, ...data } =
      (await request.json()) as AdminCreatePayload
    const taken = usernameTaken(data.username)
    if (taken) return taken
    if (!warehouseSummary(warehouse_id)) {
      return fieldError('warehouse_id', 'Склад не найден.')
    }
    const admin: MockUser = {
      ...data,
      id: nextId(users),
      role: 'admin',
      language: 'ru',
      warehouse_id,
      client_code: null,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    users.push(admin)
    return HttpResponse.json(toStaffAccount(admin), { status: 201 })
  }),

  http.patch(`${API_URL}/admins/:id/`, async ({ request, params }) => {
    await delay()
    const { error } = guard(request, ['super_admin'])
    if (error) return error
    const admin = users.find(
      (u) => u.id === Number(params.id) && u.role === 'admin'
    )
    if (!admin) return notFound()
    Object.assign(admin, (await request.json()) as AdminUpdatePayload)
    return HttpResponse.json(toStaffAccount(admin))
  }),

  http.post(
    `${API_URL}/admins/:id/set-password/`,
    async ({ request, params }) => {
      await delay()
      const { error } = guard(request, ['super_admin'])
      if (error) return error
      const admin = users.find(
        (u) => u.id === Number(params.id) && u.role === 'admin'
      )
      if (!admin) return notFound()
      admin.password = ((await request.json()) as { password: string }).password
      return new HttpResponse(null, { status: 204 })
    }
  ),

  // Workers: admin manages own warehouse, super-admin any
  http.get(`${API_URL}/workers/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['super_admin', 'admin'])
    if (error) return error
    const warehouseId = scopedWarehouse(user, request)
    return HttpResponse.json(
      users
        .filter(
          (u) =>
            u.role === 'worker' &&
            (warehouseId === null || u.warehouse_id === warehouseId)
        )
        .map(toStaffAccount)
    )
  }),

  http.patch(`${API_URL}/workers/:id/`, async ({ request, params }) => {
    await delay()
    const { user, error } = guard(request, ['super_admin', 'admin'])
    if (error) return error
    const worker = users.find(
      (u) => u.id === Number(params.id) && u.role === 'worker'
    )
    if (!worker) return notFound()
    if (!belongsTo(user, worker.warehouse_id ?? -1)) return forbidden()
    const { is_active } = (await request.json()) as { is_active: boolean }
    worker.is_active = is_active
    return HttpResponse.json(toStaffAccount(worker))
  }),

  http.post(
    `${API_URL}/workers/:id/set-password/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, ['super_admin', 'admin'])
      if (error) return error
      const worker = users.find(
        (u) => u.id === Number(params.id) && u.role === 'worker'
      )
      if (!worker) return notFound()
      if (!belongsTo(user, worker.warehouse_id ?? -1)) return forbidden()
      worker.password = (
        (await request.json()) as { password: string }
      ).password
      return new HttpResponse(null, { status: 204 })
    }
  ),

  http.get(`${API_URL}/user-requests/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['super_admin', 'admin'])
    if (error) return error
    const visible =
      user.role === 'super_admin'
        ? userRequests
        : userRequests.filter((r) => r.requested_by.id === user.id)
    return HttpResponse.json(
      [...visible].reverse().map(withoutPassword) // newest first
    )
  }),

  http.post(`${API_URL}/user-requests/`, async ({ request }) => {
    await delay()
    const { user, error } = guard(request, ['admin'])
    if (error) return error
    const data = (await request.json()) as UserRequestPayload
    const taken = usernameTaken(data.username)
    if (taken) return taken
    const created = {
      ...data,
      id: nextId(userRequests),
      role: 'worker' as const,
      warehouse: warehouseSummary(user.warehouse_id)!,
      status: 'pending' as const,
      requested_by: { id: user.id, full_name: user.full_name },
      created_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      reject_reason: null,
    }
    userRequests.push(created)
    return HttpResponse.json(withoutPassword(created), { status: 201 })
  }),

  http.post(
    `${API_URL}/user-requests/:id/:action/`,
    async ({ request, params }) => {
      await delay()
      const { user, error } = guard(request, ['super_admin'])
      if (error) return error
      const item = userRequests.find((r) => r.id === Number(params.id))
      if (!item || !['approve', 'reject'].includes(String(params.action))) {
        return notFound()
      }
      if (item.status !== 'pending') {
        return HttpResponse.json(
          { detail: 'Запрос уже рассмотрен.' },
          { status: 400 }
        )
      }

      if (params.action === 'approve') {
        users.push({
          id: nextId(users),
          role: 'worker',
          username: item.username,
          full_name: item.full_name,
          phone: item.phone,
          email: item.email,
          language: 'ru',
          warehouse_id: item.warehouse.id,
          client_code: null,
          password: item.password,
          is_active: true,
          created_at: new Date().toISOString(),
        })
        item.status = 'approved'
      } else {
        const { reason } = (await request.json()) as { reason: string }
        if (!reason?.trim()) {
          return fieldError('reason', 'Укажите причину отказа.')
        }
        item.status = 'rejected'
        item.reject_reason = reason.trim()
      }
      item.reviewed_by = { id: user.id, full_name: user.full_name }
      item.reviewed_at = new Date().toISOString()
      return HttpResponse.json(withoutPassword(item))
    }
  ),
]
