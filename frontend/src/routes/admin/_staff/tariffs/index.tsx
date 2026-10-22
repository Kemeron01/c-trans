import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { SectionPlaceholder } from '@/features/section-placeholder'

export const Route = createFileRoute('/admin/_staff/tariffs/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'tariffs'),
  component: () => <SectionPlaceholder section='tariffs' />,
})
