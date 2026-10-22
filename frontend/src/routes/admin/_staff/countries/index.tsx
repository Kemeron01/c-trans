import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Countries } from '@/features/countries'

export const Route = createFileRoute('/admin/_staff/countries/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'countries'),
  component: Countries,
})
