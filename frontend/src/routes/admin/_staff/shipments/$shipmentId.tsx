import { createFileRoute } from '@tanstack/react-router'
import { requireSection } from '@/lib/route-guards'
import { ShipmentDetail } from '@/features/shipments/shipment-detail'

export const Route = createFileRoute('/admin/_staff/shipments/$shipmentId')({
  beforeLoad: ({ context }) => requireSection(context.user, 'shipments'),
  component: ShipmentDetail,
})
