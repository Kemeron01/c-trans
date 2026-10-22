import { useTranslation } from 'react-i18next'
import { type OrderStatus } from '@/api/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const TONE: Partial<Record<OrderStatus, string>> = {
  lead_new: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  lead_negotiation: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  awaiting_payment:
    'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  in_transit:
    'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  arrived_uz:
    'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  delivered:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  cancelled: 'bg-muted text-muted-foreground line-through',
  lead_rejected: 'bg-muted text-muted-foreground line-through',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  return (
    <Badge
      variant='secondary'
      className={cn('whitespace-nowrap', TONE[status])}
    >
      {t(`orderStatus.${status}`)}
    </Badge>
  )
}
