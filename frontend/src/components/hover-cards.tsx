import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ordersQuery } from '@/api/orders'
import { shipmentQuery } from '@/api/shipments'
import { type ClientRef } from '@/api/types'
import { formatDate } from '@/lib/format'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { ShipmentStatusBadge } from '@/features/shipments/shipment-status-badge'

/**
 * Open state of a hover card that is closed by a route change. The card
 * remembers the path it was opened on and counts as open only there, so
 * navigating (e.g. clicking an order number while the card is shown) closes
 * it in the same render, before its trigger unmounts and Popper drops the
 * card to the page corner.
 */
function useRouteBoundOpen() {
  const pathname = useLocation({ select: (l) => l.pathname })
  const [openOn, setOpenOn] = useState<string | null>(null)
  return [
    openOn === pathname,
    (open: boolean) => setOpenOn(open ? pathname : null),
  ] as const
}

/**
 * Hover a client (name / code) to see phone, code and number of orders.
 * `children` is the element to hover (rendered as-is, no extra wrapper).
 */
export function ClientHoverCard({
  client,
  children,
}: {
  client: ClientRef
  children: React.ReactElement
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useRouteBoundOpen()
  // Orders of this client visible to the viewer; count only, loaded on hover
  const orders = useQuery({
    ...ordersQuery({ search: client.client_code, page_size: 1 }),
    enabled: open,
  })
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className='grid w-64 gap-1 text-sm'>
        <div className='font-medium'>{client.full_name}</div>
        <div className='text-muted-foreground'>
          {t('hover.phone')}: {client.phone}
        </div>
        <div className='text-muted-foreground'>
          {t('hover.code')}:{' '}
          <span className='font-mono'>{client.client_code}</span>
        </div>
        <div>
          {orders.data
            ? t('hover.ordersCount', { count: orders.data.count })
            : '…'}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

/** Hover a shipment number to see its route, status and dates. */
export function ShipmentHoverCard({
  shipmentId,
  children,
}: {
  shipmentId: number
  children: React.ReactElement
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useRouteBoundOpen()
  const shipment = useQuery({ ...shipmentQuery(shipmentId), enabled: open })
  const s = shipment.data
  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className='grid w-72 gap-1 text-sm'>
        {s ? (
          <>
            <div className='flex items-center justify-between gap-2'>
              <span className='font-medium'>{s.number}</span>
              <ShipmentStatusBadge status={s.status} />
            </div>
            <div className='text-muted-foreground'>
              {t('hover.route')}: {s.origin_warehouse.name} →{' '}
              {s.destination_warehouse.name} · {t(`method.${s.method}`)}
            </div>
            <div className='text-muted-foreground'>
              {t('hover.departure')}:{' '}
              {formatDate(s.departed_at ?? s.planned_departure)}
            </div>
            <div className='text-muted-foreground'>
              {t('hover.arrival')}:{' '}
              {formatDate(s.arrived_at ?? s.planned_arrival)}
            </div>
          </>
        ) : (
          '…'
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
