import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { SectionPlaceholder } from '@/features/section-placeholder'

export const Route = createFileRoute('/admin/_staff/warehouses/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'warehouses'),
  component: () => <SectionPlaceholder section='warehouses' />,
})
