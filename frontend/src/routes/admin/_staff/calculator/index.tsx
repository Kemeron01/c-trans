import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Calculator } from '@/features/calculator'

export const Route = createFileRoute('/admin/_staff/calculator/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'calculator'),
  component: Calculator,
})
