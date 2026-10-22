import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeft, Ban, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { orderQuery, ordersApi } from '@/api/orders'
import { type Dimensions, type Order, type OrderStatus } from '@/api/types'
import {
  formatDateTime,
  formatNumber,
  formatUsd,
  formatUzs,
} from '@/lib/format'
import { canCancel, isOnSide, manualSteps } from '@/lib/order-flow'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useLocalized } from '@/hooks/use-localized'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { CancelDialog, WeighDialog } from './order-dialogs'
import { OrderStatusBadge } from './order-status-badge'
import { useOrderSaved } from './use-order-saved'

const route = getRouteApi('/admin/_staff/orders/$orderId')

type DialogState =
  | { type: 'weigh' | 'cancel' }
  | { type: 'step'; to: OrderStatus }
  | null

export function OrderDetail() {
  const { t } = useTranslation()
  const { orderId } = route.useParams()
  const { data: order, isLoading } = useQuery(orderQuery(Number(orderId)))

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <Button asChild variant='ghost' size='sm' className='self-start'>
          <Link to='/admin/orders'>
            <ArrowLeft /> {t('nav.sections.orders')}
          </Link>
        </Button>
        {isLoading || !order ? (
          <Skeleton className='h-64 w-full' />
        ) : (
          <OrderView order={order} />
        )}
      </Main>
    </>
  )
}

function OrderView({ order }: { order: Order }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const user = useCurrentUser()
  const saved = useOrderSaved()
  const [dialog, setDialog] = useState<DialogState>(null)

  const setStatus = useMutation({
    mutationFn: (to: OrderStatus) => ordersApi.setStatus(order.id, to),
    onSuccess: () => {
      saved()
      toast.success(t('common.saved'))
      setDialog(null)
    },
  })

  const steps = manualSteps(order).filter((s) => isOnSide(user, order, s.side))
  const canWeigh =
    order.status === 'awaiting_arrival' && isOnSide(user, order, 'origin')
  const a = order.amounts
  const dims = (d: Dimensions) =>
    `${formatNumber(d.weight_kg)} ${t('dims.kg')} · ${d.length_cm}×${d.width_cm}×${d.height_cm} ${t('dims.cm')}`

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-3'>
          <h2 className='text-2xl font-bold tracking-tight'>{order.number}</h2>
          <OrderStatusBadge status={order.status} />
          <Badge variant='outline'>{t(`orderType.${order.type}`)}</Badge>
        </div>
        <div className='flex flex-wrap gap-2'>
          {canWeigh && (
            <Button onClick={() => setDialog({ type: 'weigh' })}>
              <Scale /> {t('orders.weigh')}
            </Button>
          )}
          {steps.map((s) => (
            <Button
              key={s.to}
              onClick={() => setDialog({ type: 'step', to: s.to })}
            >
              {t(`orderAction.${s.to}` as 'orderAction.delivered')}
            </Button>
          ))}
          {canCancel(user, order) && (
            <Button
              variant='outline'
              onClick={() => setDialog({ type: 'cancel' })}
            >
              <Ban /> {t('orders.cancel')}
            </Button>
          )}
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>{t('orders.client')}</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-1 text-sm'>
            <div className='font-medium'>{order.client.full_name}</div>
            <div className='font-mono'>{order.client.client_code}</div>
            <div>{order.client.phone}</div>
            {order.delivery_address && (
              <div className='text-muted-foreground'>
                {order.delivery_address}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('orders.route')}</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-1 text-sm'>
            <div>
              {order.origin_warehouse.name} → {order.destination_warehouse.name}
            </div>
            <div>
              {t(`method.${order.method}`)} ·{' '}
              {t(`receiveMethod.${order.receive_method}`)}
            </div>
            {order.shipment && (
              <Link
                to='/admin/shipments/$shipmentId'
                params={{ shipmentId: String(order.shipment.id) }}
                className='underline underline-offset-4'
              >
                {t('orders.shipment')}: {order.shipment.number}
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t('orders.amounts')}
              {a.is_preliminary && (
                <Badge variant='outline' className='ms-2'>
                  {t('orders.preliminary')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className='grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm'>
              {order.type === 'catalog' && (
                <>
                  <dt className='text-muted-foreground'>{t('orders.goods')}</dt>
                  <dd>{formatUsd(a.goods_usd)}</dd>
                </>
              )}
              <dt className='text-muted-foreground'>{t('orders.delivery')}</dt>
              <dd>{formatUsd(a.delivery_usd)}</dd>
              {order.receive_method === 'courier' && (
                <>
                  <dt className='text-muted-foreground'>
                    {t('orders.courier')}
                  </dt>
                  <dd>{formatUsd(a.courier_usd)}</dd>
                </>
              )}
              <dt className='font-medium'>{t('orders.total')}</dt>
              <dd className='font-medium'>{formatUsd(a.total_usd)}</dd>
              {a.total_uzs !== null && (
                <>
                  <dt className='text-muted-foreground'>
                    {t('orders.charged', {
                      rate: formatNumber(a.rate_uzs ?? 0),
                    })}
                  </dt>
                  <dd>{formatUzs(a.total_uzs)}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>
              {order.type === 'catalog' ? t('orders.items') : t('orders.cargo')}
            </CardTitle>
          </CardHeader>
          <CardContent className='text-sm'>
            {order.type === 'catalog' ? (
              <ul className='grid gap-2'>
                {order.items.map((i) => (
                  <li key={i.product_id} className='flex justify-between gap-4'>
                    <span>
                      {localized(i.name)} × {i.quantity}
                    </span>
                    <span>{formatUsd(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              order.cargo && (
                <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1'>
                  <dt className='text-muted-foreground'>
                    {t('orders.cargoDescription')}
                  </dt>
                  <dd>{order.cargo.description}</dd>
                  <dt className='text-muted-foreground'>
                    {t('orders.tracking')}
                  </dt>
                  <dd className='font-mono'>
                    {order.cargo.tracking_numbers.join(', ')}
                  </dd>
                  <dt className='text-muted-foreground'>
                    {t('orders.declared')}
                  </dt>
                  <dd>{dims(order.cargo.declared)}</dd>
                  <dt className='text-muted-foreground'>
                    {t('orders.actual')}
                  </dt>
                  <dd>{order.cargo.actual ? dims(order.cargo.actual) : '—'}</dd>
                  {order.cargo.chargeable_weight !== null && (
                    <>
                      <dt className='text-muted-foreground'>
                        {t('calculator.chargeableWeight')}
                      </dt>
                      <dd>
                        {formatNumber(order.cargo.chargeable_weight)}{' '}
                        {t('dims.kg')}{' '}
                        <span className='text-muted-foreground'>
                          ({t('calculator.volumeWeight')}:{' '}
                          {formatNumber(order.cargo.volume_weight ?? 0)})
                        </span>
                      </dd>
                    </>
                  )}
                </dl>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('orders.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className='relative grid gap-4 border-s ps-5 text-sm'>
              {order.history
                .slice()
                .reverse()
                .map((h, i) => (
                  <li key={i}>
                    <span className='absolute -start-1.5 mt-1.5 size-3 rounded-full border bg-background' />
                    <div className='font-medium'>
                      {t(`orderStatus.${h.status}`)}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {formatDateTime(h.at)} ·{' '}
                      {h.changed_by?.full_name ?? t('orders.system')}
                    </div>
                    {h.comment && <div>{h.comment}</div>}
                  </li>
                ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {dialog?.type === 'weigh' && (
        <WeighDialog order={order} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'cancel' && (
        <CancelDialog order={order} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'step' && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title={t(`orderAction.${dialog.to}` as 'orderAction.delivered')}
          desc={t('orders.stepConfirm', {
            number: order.number,
            status: t(`orderStatus.${dialog.to}`),
          })}
          isLoading={setStatus.isPending}
          handleConfirm={() => setStatus.mutate(dialog.to)}
        />
      )}
    </>
  )
}
