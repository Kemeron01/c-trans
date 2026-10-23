import { createFileRoute, Outlet } from '@tanstack/react-router'
import { loadClientUser } from '@/lib/route-guards'

// Signed-in clients only.
export const Route = createFileRoute('/_site/_client')({
  beforeLoad: async ({ context, location }) => ({
    user: await loadClientUser(context.queryClient, location),
  }),
  component: Outlet,
})
