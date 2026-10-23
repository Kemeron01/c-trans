import { createFileRoute } from '@tanstack/react-router'
import { ClientOrders } from '@/features/client/orders'

export const Route = createFileRoute('/_site/_client/orders/')({
  component: ClientOrders,
})
