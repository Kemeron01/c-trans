import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { SectionPlaceholder } from '@/features/section-placeholder'

export const Route = createFileRoute('/admin/_staff/courier-tariffs/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'courier_tariffs'),
  component: () => <SectionPlaceholder section='courier_tariffs' />,
})
