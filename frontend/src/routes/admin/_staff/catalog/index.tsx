import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Catalog } from '@/features/catalog'

export const Route = createFileRoute('/admin/_staff/catalog/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'catalog'),
  component: Catalog,
})
