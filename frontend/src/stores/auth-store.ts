import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

// The user itself is not stored here: it comes from `GET /auth/me/`
// through TanStack Query (see meQueryOptions).
const ACCESS_TOKEN_COOKIE = 'ct_access_token'

interface AuthState {
  accessToken: string
  setAccessToken: (accessToken: string) => void
  reset: () => void
}

function readToken() {
  const raw = getCookie(ACCESS_TOKEN_COOKIE)
  return raw ? decodeURIComponent(raw) : ''
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: readToken(),
  setAccessToken: (accessToken) => {
    setCookie(ACCESS_TOKEN_COOKIE, encodeURIComponent(accessToken))
    set({ accessToken })
  },
  reset: () => {
    removeCookie(ACCESS_TOKEN_COOKIE)
    set({ accessToken: '' })
  },
}))
