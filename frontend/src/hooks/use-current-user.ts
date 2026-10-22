import { useSuspenseQuery } from '@tanstack/react-query'
import { meQueryOptions } from '@/api/auth'

/**
 * Signed-in user. Use only below a route whose beforeLoad already loaded
 * `/auth/me/` (e.g. the /admin layout), so it never suspends there.
 */
export function useCurrentUser() {
  return useSuspenseQuery(meQueryOptions()).data
}
