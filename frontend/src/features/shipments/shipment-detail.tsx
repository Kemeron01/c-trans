import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  MapPin,
  PackageCheck,
  Plus,
  Send,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ordersQuery } from '@/api/orders'
import { shipmentQuery, shipmentsApi } from '@/api/shipments'
import { type Shipment } from '@/api/types'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useLocalized } from '@/hooks/use-localized'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { OrderStatusBadge } from '../orders/order-status-badge'
import { AddOrdersDialog, CheckpointDialog } from './shipment-dialogs'
import { ShipmentStatusBadge } from './shipment-status-badge'
import { useShipmentSaved } from './use-shipment-saved'

const route = getRouteApi('/admin/_staff/shipments/$shipmentId')

export function ShipmentDetail() {
  const { t } = useTranslation()
  const { shipmentId } = route.useParams()
  const { data, isLoading } = useQuery(shipmentQuery(Number(shipmentId)))
  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <Button asChild variant='ghost' size='sm' className='self-start'>
          <Link to='/admin/shipments'>
            <ArrowLeft /> {t('nav.sections.shipments')}
          </Link>
        </Button>
        {isLoading || !data ? (
          <Skeleton className='h-64 w-full' />
        ) : (
          <ShipmentView shipment={data} />
        )}
      </Main>
    </>
  )
}

type DialogState =
  | 'orders'
  | 'checkpoint'
  | 'depart'
  | 'arrive'
  | { remove: number }
  | null

function ShipmentView({ shipment: s }: { shipment: Shipment }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const user = useCurrentUser()
  const saved = useShipmentSaved()
  const orders = useQuery(ordersQuery()).data ?? []
  const [dialog, setDialog] = useState<DialogState>(null)

  const isOrigin =
    user.role === 'super_admin' || user.warehouse?.id === s.origin_warehouse.id
  const isDestination =
    user.role === 'super_admin' ||
    user.warehouse?.id === s.destination_warehouse.id
  const forming = s.status === 'forming'
  const included = orders.filter((o) => s.order_ids.includes(o.id))

  const act = useMutation({
    mutationFn: (
      action: Exclude<DialogState, 'orders' | 'checkpoint' | null>
    ) =>
      action === 'depart'
        ? shipmentsApi.depart(s.id)
        : action === 'arrive'
          ? shipmentsApi.arrive(s.id)
          : shipmentsApi.removeOrder(s.id, action.remove),
    onSuccess: () => {
      saved()
      toast.success(t('common.saved'))
      setDialog(null)
    },
  })

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-3'>
          <h2 className='text-2xl font-bold tracking-tight'>{s.number}</h2>
          <ShipmentStatusBadge status={s.status} />
        </div>
        <div className='flex flex-wrap gap-2'>
          {forming && isOrigin && (
            <>
              <Button variant='outline' onClick={() => setDialog('orders')}>
                <Plus /> {t('shipments.addOrders')}
              </Button>
              <Button
                disabled={!s.order_ids.length}
                onClick={() => setDialog('depart')}
              >
                <Send /> {t('shipments.depart')}
              </Button>
            </>
          )}
          {s.status === 'in_transit' && isOrigin && (
            <Button variant='outline' onClick={() => setDialog('checkpoint')}>
              <MapPin /> {t('shipments.addCheckpoint')}
            </Button>
          )}
          {s.status === 'in_transit' && isDestination && (
            <Button onClick={() => setDialog('arrive')}>
              <PackageCheck /> {t('shipments.arrive')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className='grid gap-4 text-sm sm:grid-cols-3'>
          <div>
            <div className='text-muted-foreground'>{t('orders.route')}</div>
            <div className='font-medium'>
              {s.origin_warehouse.name} → {s.destination_warehouse.name}
            </div>
            <div>{t(`method.${s.method}`)}</div>
          </div>
          <div>
            <div className='text-muted-foreground'>
              {t('shipments.departure')}
            </div>
            <div>
              {t('shipments.planned')}: {formatDate(s.planned_departure)}
            </div>
            <div>
              {t('shipments.actual')}: {formatDateTime(s.departed_at)}
            </div>
          </div>
          <div>
            <div className='text-muted-foreground'>
              {t('shipments.arrival')}
            </div>
            <div>
              {t('shipments.planned')}: {formatDate(s.planned_arrival)}
            </div>
            <div>
              {t('shipments.actual')}: {formatDateTime(s.arrived_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 lg:grid-cols-[2fr_1fr]'>
        <Card>
          <CardHeader>
            <CardTitle>
              {t('shipments.orders')} ({s.order_ids.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orders.number')}</TableHead>
                  <TableHead>{t('orders.client')}</TableHead>
                  <TableHead>{t('dims.weight')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  {forming && isOrigin && <TableHead className='w-12' />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {included.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        to='/admin/orders/$orderId'
                        params={{ orderId: String(o.id) }}
                        className='font-medium underline-offset-4 hover:underline'
                      >
                        {o.number}
                      </Link>
                    </TableCell>
                    <TableCell>{o.client.full_name}</TableCell>
                    <TableCell>
                      {o.cargo?.chargeable_weight != null
                        ? `${formatNumber(o.cargo.chargeable_weight)} ${t('dims.kg')}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    {forming && isOrigin && (
                      <TableCell>
                        <Button
                          size='icon'
                          variant='ghost'
                          aria-label={t('shipments.removeOrder')}
                          onClick={() => setDialog({ remove: o.id })}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!included.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='h-16 text-center text-muted-foreground'
                    >
                      {t('shipments.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('shipments.checkpoints')}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.checkpoints.length ? (
              <ol className='relative grid gap-4 border-s ps-5 text-sm'>
                {s.checkpoints.map((c) => (
                  <li key={c.id}>
                    <span className='absolute -start-1.5 mt-1.5 size-3 rounded-full bg-primary' />
                    <div className='font-medium'>{localized(c.name)}</div>
                    <div className='text-xs text-muted-foreground'>
                      {formatDateTime(c.at)} · {c.created_by.full_name}
                    </div>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=8/${c.latitude}/${c.longitude}`}
                      target='_blank'
                      rel='noreferrer'
                      className='text-xs underline underline-offset-4'
                    >
                      {c.latitude}, {c.longitude}
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t('shipments.noCheckpoints')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {dialog === 'orders' && (
        <AddOrdersDialog
          shipment={s}
          orders={orders}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'checkpoint' && (
        <CheckpointDialog shipment={s} onClose={() => setDialog(null)} />
      )}
      {(dialog === 'depart' ||
        dialog === 'arrive' ||
        (typeof dialog === 'object' && dialog !== null)) && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title={
            dialog === 'depart'
              ? t('shipments.depart')
              : dialog === 'arrive'
                ? t('shipments.arrive')
                : t('shipments.removeOrder')
          }
          desc={
            dialog === 'depart'
              ? t('shipments.departConfirm', { count: s.order_ids.length })
              : dialog === 'arrive'
                ? t('shipments.arriveConfirm', { count: s.order_ids.length })
                : t('shipments.removeConfirm')
          }
          destructive={typeof dialog === 'object'}
          isLoading={act.isPending}
          handleConfirm={() => act.mutate(dialog)}
        />
      )}
    </>
  )
}
