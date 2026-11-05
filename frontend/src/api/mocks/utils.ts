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

type PageSpec<T> = {
  /** Text the `search` param is looked for in. */
  search?: (item: T) => string
  /** Query param → value of the item; the param is `a,b` (any of). */
  filters?: Record<string, (item: T) => string | undefined>
  /** `ordering` field → sort key. */
  ordering: Record<string, (item: T) => string | number>
}

/** Like DRF's SearchFilter + OrderingFilter + PageNumberPagination. */
export function paginate<T>(request: Request, items: T[], spec: PageSpec<T>) {
  const q = new URL(request.url).searchParams
  let rows = items
  const search = q.get('search')?.trim().toLowerCase()
  if (search && spec.search) {
    rows = rows.filter((x) => spec.search!(x).toLowerCase().includes(search))
  }
  for (const [param, get] of Object.entries(spec.filters ?? {})) {
    const wanted = q.get(param)?.split(',').filter(Boolean)
    if (wanted?.length) {
      rows = rows.filter((x) => wanted.includes(get(x) ?? ''))
    }
  }
  const ordering = q.get('ordering') ?? '-created_at'
  const desc = ordering.startsWith('-')
  const key = spec.ordering[desc ? ordering.slice(1) : ordering]
  if (key) {
    rows = rows.slice().sort((a, b) => {
      const [x, y] = [key(a), key(b)]
      const cmp = x < y ? -1 : x > y ? 1 : 0
      return desc ? -cmp : cmp
    })
  }
  const pageSize = Math.min(Math.max(Number(q.get('page_size')) || 10, 1), 100)
  const page = Math.max(Number(q.get('page')) || 1, 1)
  return HttpResponse.json({
    count: rows.length,
    results: rows.slice((page - 1) * pageSize, page * pageSize),
  })
}
