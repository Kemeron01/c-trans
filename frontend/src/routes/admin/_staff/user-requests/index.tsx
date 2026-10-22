import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { UserRequests } from '@/features/user-requests'

export const Route = createFileRoute('/admin/_staff/user-requests/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'user_requests'),
  component: UserRequests,
})
