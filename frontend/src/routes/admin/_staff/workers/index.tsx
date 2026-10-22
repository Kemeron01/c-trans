import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Workers } from '@/features/workers'

export const Route = createFileRoute('/admin/_staff/workers/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'workers'),
  component: Workers,
})
