import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { meQueryOptions } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { isStaff } from '@/lib/permissions'
import { StaffSignIn } from '@/features/auth/sign-in'

const searchSchema = z.object({
  // Only admin pages: never send the user to an arbitrary URL after sign-in
  redirect: z.string().startsWith('/admin').optional().catch(undefined),
})

export const Route = createFileRoute('/admin/sign-in')({
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    // Already signed in: skip the form
    if (!useAuthStore.getState().accessToken) return
    const user = await context.queryClient
      .ensureQueryData(meQueryOptions())
      .catch(() => null)
    if (user && isStaff(user)) {
      throw redirect({ to: search.redirect || '/admin' })
    }
  },
  component: StaffSignIn,
})
