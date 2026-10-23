import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Clients } from '@/features/clients'

export const Route = createFileRoute('/admin/_staff/clients/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'clients'),
  component: Clients,
})
