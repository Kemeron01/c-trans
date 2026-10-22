import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Admins } from '@/features/admins'

export const Route = createFileRoute('/admin/_staff/admins/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'admins'),
  component: Admins,
})
