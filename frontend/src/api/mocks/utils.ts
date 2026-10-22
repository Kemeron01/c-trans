import { HttpResponse } from 'msw'
import { type Role } from '../types'
import { type MockUser, userFromAuthHeader, userRequests, users } from './db'

type Guarded =
  | { user: MockUser; error?: undefined }
  | { user?: undefined; error: Response }

/** Authenticates the request and checks the role, like a DRF permission class. */
export function guard(request: Request, roles: Role[]): Guarded {
  const user = userFromAuthHeader(request.headers.get('Authorization'))
  if (!user) {
    return {
      error: HttpResponse.json(
        { detail: 'Authentication credentials were not provided.' },
        { status: 401 }
      ),
    }
  }
  if (!roles.includes(user.role)) {
    return {
      error: HttpResponse.json(
        { detail: 'You do not have permission to perform this action.' },
        { status: 403 }
      ),
    }
  }
  return { user }
}

export const notFound = () =>
  HttpResponse.json({ detail: 'Not found.' }, { status: 404 })

/** DRF-style field validation error: `{ field: [message] }`. */
export const fieldError = (field: string, message: string) =>
  HttpResponse.json({ [field]: [message] }, { status: 400 })

/** Usernames are unique across accounts and pending requests. */
export function usernameTaken(username: string) {
  const taken =
    users.some((u) => u.username === username) ||
    userRequests.some((r) => r.username === username && r.status === 'pending')
  return taken
    ? fieldError('username', 'Пользователь с таким логином уже существует.')
    : null
}

/** super_admin, or staff of that warehouse. */
export const belongsTo = (user: MockUser, warehouseId: number) =>
  user.role === 'super_admin' || user.warehouse_id === warehouseId

/** Warehouse a list request is about: own for staff, ?warehouse= for super. */
export function scopedWarehouse(user: MockUser, request: Request) {
  if (user.role !== 'super_admin') return user.warehouse_id
  const param = new URL(request.url).searchParams.get('warehouse')
  return param ? Number(param) : null
}

export const badRequest = (detail: string) =>
  HttpResponse.json({ detail }, { status: 400 })

export const forbidden = () =>
  HttpResponse.json(
    { detail: 'You do not have permission to perform this action.' },
    { status: 403 }
  )

export const STAFF = ['super_admin', 'admin', 'worker'] as const
export const MANAGERS = ['super_admin', 'admin'] as const
