import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { OrderDetail } from '@/features/orders/order-detail'

export const Route = createFileRoute('/admin/_staff/orders/$orderId')({
  beforeLoad: ({ context }) => requireSection(context.user, 'orders'),
  component: OrderDetail,
})
