import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Tariffs } from '@/features/tariffs'

export const Route = createFileRoute('/admin/_staff/tariffs/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'tariffs'),
  component: Tariffs,
})
