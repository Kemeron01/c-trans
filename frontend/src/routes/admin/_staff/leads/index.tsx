import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Leads } from '@/features/leads'

export const Route = createFileRoute('/admin/_staff/leads/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'leads'),
  component: Leads,
})
