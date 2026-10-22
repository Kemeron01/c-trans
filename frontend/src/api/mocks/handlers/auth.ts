import { delay, http, HttpResponse } from 'msw'
import { type LoginResponse, type StaffLoginPayload } from '../../auth'
import { API_URL } from '../../config'
import { toCurrentUser, tokenFor, userFromAuthHeader, users } from '../db'

export const authHandlers = [
  http.post(`${API_URL}/auth/staff/login/`, async ({ request }) => {
    await delay()
    const { username, password } = (await request.json()) as StaffLoginPayload
    const user = users.find(
      (u) => u.username === username && u.role !== 'client'
    )

    if (!user || user.password !== password) {
      return HttpResponse.json(
        { detail: 'Invalid username or password.' },
        { status: 401 }
      )
    }
    if (!user.is_active) {
      return HttpResponse.json(
        { detail: 'Account is blocked.' },
        { status: 403 }
      )
    }

    return HttpResponse.json<LoginResponse>({
      access: tokenFor(user.id),
      user: toCurrentUser(user),
    })
  }),

  http.get(`${API_URL}/auth/me/`, async ({ request }) => {
    await delay()
    const user = userFromAuthHeader(request.headers.get('Authorization'))
    if (!user) {
      return HttpResponse.json(
        { detail: 'Authentication credentials were not provided.' },
        { status: 401 }
      )
    }
    return HttpResponse.json(toCurrentUser(user))
  }),

  http.post(
    `${API_URL}/auth/logout/`,
    () => new HttpResponse(null, { status: 204 })
  ),
]
