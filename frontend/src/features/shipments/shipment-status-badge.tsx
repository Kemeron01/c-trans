import { useTranslation } from 'react-i18next'
import { type ShipmentStatus } from '@/api/types'
import { Badge } from '@/components/ui/badge'

const VARIANT = {
  forming: 'outline',
  in_transit: 'default',
  arrived: 'secondary',
} as const satisfies Record<ShipmentStatus, string>

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const { t } = useTranslation()
  return (
    <Badge variant={VARIANT[status]}>{t(`shipmentStatus.${status}`)}</Badge>
  )
}
