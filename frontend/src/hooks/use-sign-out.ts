import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'

/** Ends the session; staff go to the admin sign-in, clients to the site. */
export function useSignOut(
  redirectTo: '/admin/sign-in' | '/' = '/admin/sign-in'
) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return async () => {
    // Best effort: the session ends locally even if the request fails
    authApi.logout().catch(() => undefined)
    useAuthStore.getState().reset()
    await navigate({ to: redirectTo, replace: true })
    queryClient.clear()
  }
}
