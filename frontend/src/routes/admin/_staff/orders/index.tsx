import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Orders } from '@/features/orders'

export const Route = createFileRoute('/admin/_staff/orders/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'orders'),
  component: Orders,
})
