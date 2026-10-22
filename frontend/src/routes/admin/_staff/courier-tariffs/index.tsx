import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { CourierTariffs } from '@/features/courier-tariffs'

export const Route = createFileRoute('/admin/_staff/courier-tariffs/')({
  beforeLoad: ({ context }) => requireSection(context.user, 'courier_tariffs'),
  component: CourierTariffs,
})
