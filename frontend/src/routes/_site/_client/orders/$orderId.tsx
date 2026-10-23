import { createFileRoute } from '@tanstack/react-router'
import { ClientOrderDetail } from '@/features/client/order-detail'

export const Route = createFileRoute('/_site/_client/orders/$orderId')({
  component: ClientOrderDetail,
})
