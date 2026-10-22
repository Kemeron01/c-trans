import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { SectionPlaceholder } from '@/features/section-placeholder'

export const Route = createFileRoute('/admin/_staff/workers/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'workers'),
  component: () => <SectionPlaceholder section='workers' />,
})
