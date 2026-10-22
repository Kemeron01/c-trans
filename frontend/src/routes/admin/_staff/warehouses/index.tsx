import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { Warehouses } from '@/features/warehouses'

export const Route = createFileRoute('/admin/_staff/warehouses/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'warehouses'),
  component: Warehouses,
})
