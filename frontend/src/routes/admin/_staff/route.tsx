import { createFileRoute } from '@tanstack/react-router'
import { loadStaffUser } from '@/lib/route-guards'
import { StaffLayout } from '@/components/layout/staff-layout'

// Pathless layout for every /admin/* page except sign-in.
// Child routes receive the signed-in staff user as `context.user`.
export const Route = createFileRoute('/admin/_staff')({
  beforeLoad: async ({ context, location }) => ({
    user: await loadStaffUser(context.queryClient, location),
  }),
  component: StaffLayout,
})
