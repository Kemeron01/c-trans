import { queryOptions } from '@tanstack/react-query'
import { api } from './client'
import { type CurrentUser } from './types'

export type StaffLoginPayload = {
  username: string
  password: string
}

export type LoginResponse = {
  access: string
  user: CurrentUser
}

export const authApi = {
  staffLogin: (payload: StaffLoginPayload) =>
    api.post<LoginResponse>('/auth/staff/login/', payload).then((r) => r.data),
  me: () => api.get<CurrentUser>('/auth/me/').then((r) => r.data),
  logout: () => api.post('/auth/logout/').then(() => undefined),
}

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export const meQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
  })
