import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'

export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return async () => {
    // Best effort: the session ends locally even if the request fails
    authApi.logout().catch(() => undefined)
    useAuthStore.getState().reset()
    await navigate({ to: '/admin/sign-in', replace: true })
    queryClient.clear()
  }
}
