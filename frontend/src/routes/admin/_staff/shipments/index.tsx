import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Shipments } from '@/features/shipments'

export const Route = createFileRoute('/admin/_staff/shipments/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'shipments'),
  component: Shipments,
})
