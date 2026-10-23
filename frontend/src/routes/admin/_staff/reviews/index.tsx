import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Reviews } from '@/features/reviews'

export const Route = createFileRoute('/admin/_staff/reviews/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'reviews'),
  component: Reviews,
})
