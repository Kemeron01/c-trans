import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, Ban, CreditCard, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  clientApi,
  clientOrderQuery,
  publicWarehousesQuery,
  trackingQuery,
} from '@/api/account'
import { type Order } from '@/api/types'
import {
  formatDateTime,
  formatNumber,
  formatUsd,
  formatUzs,
} from '@/lib/format'
import { canReview, clientCanCancel } from '@/lib/order-flow'
import { useLocalized } from '@/hooks/use-localized'
import { useUzs } from '@/hooks/use-uzs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { OrderProgress } from '@/components/order-progress'
import { RatingStars } from '@/components/rating-stars'
import { TrackingMap } from '@/components/tracking-map'
import { OrderStatusBadge } from '../orders/order-status-badge'

const route = getRouteApi('/_site/_client/orders/$orderId')

export function ClientOrderDetail() {
  const { t } = useTranslation()
  const id = Number(route.useParams().orderId)
  const valid = Number.isInteger(id) && id > 0
  const { data, isLoading, isError } = useQuery({
    ...clientOrderQuery(id),
    enabled: valid,
  })
  return (
    <div className='grid gap-6'>
      <Button asChild variant='ghost' size='sm' className='justify-self-start'>
        <Link to='/orders'>
          <ArrowLeft /> {t('site.nav.orders')}
        </Link>
      </Button>
      {!valid || isError ? (
        <EmptyState
          title={t('orders.notFound')}
          description={t('common.notFoundHint')}
        />
      ) : isLoading || !data ? (
        <Skeleton className='h-96' />
      ) : (
        <OrderView order={data} />
      )}
    </div>
  )
}

function OrderView({ order }: { order: Order }) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { uzs } = useUzs()
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState(false)
  const tracking = useQuery({
    ...trackingQuery(order.id),
    enabled: !!order.shipment,
  })
  const origin = useQuery(publicWarehousesQuery()).data?.find(
    (w) => w.id === order.origin_warehouse.id
  )
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['client'] })
  const a = order.amounts

  const cancel = useMutation({
    mutationFn: () => clientApi.cancelOrder(order.id),
    onSuccess: () => {
      refresh()
      setCancelling(false)
      toast.success(t('orders.cancelled'))
    },
  })
  const retry = useMutation({
    mutationFn: () => clientApi.retryPayment(order.id),
    onSuccess: () => {
      refresh()
      toast.success(t('clientOrders.paid'))
    },
  })

  return (
    <>
      <div className='flex flex-wrap items-center gap-3'>
        <h1 className='text-2xl font-bold tracking-tight'>{order.number}</h1>
        <OrderStatusBadge status={order.status} />
        <Badge variant='outline'>{t(`orderType.${order.type}`)}</Badge>
        {clientCanCancel(order) && (
          <Button
            variant='outline'
            className='ms-auto'
            onClick={() => setCancelling(true)}
          >
            <Ban /> {t('orders.cancel')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <OrderProgress order={order} />
        </CardContent>
      </Card>

      {order.status === 'awaiting_payment' && (
        <Alert variant='destructive'>
          <AlertTriangle />
          <AlertTitle>{t('clientOrders.paymentFailed')}</AlertTitle>
          <AlertDescription className='grid gap-2'>
            <span>{t('clientOrders.paymentFailedHint')}</span>
            <div className='flex flex-wrap gap-2'>
              <Button
                size='sm'
                disabled={retry.isPending}
                onClick={() => retry.mutate()}
              >
                <CreditCard /> {t('clientOrders.retry')}
              </Button>
              <Button asChild size='sm' variant='outline'>
                <Link to='/account' hash='cards'>
                  {t('clientOrders.changeCard')}
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {['lead_new', 'lead_negotiation'].includes(order.status) && (
        <Alert>
          <Info />
          <AlertDescription>{t('clientOrders.leadHint')}</AlertDescription>
        </Alert>
      )}
      {order.status === 'awaiting_arrival' && origin && (
        <Alert>
          <Info />
          <AlertTitle>{t('clientOrders.sendToWarehouse')}</AlertTitle>
          <AlertDescription>
            {localized(origin.country)}, {origin.city}, {origin.address}
          </AlertDescription>
        </Alert>
      )}

      {order.shipment && tracking.data && (
        <Card>
          <CardHeader>
            <CardTitle>{t('clientOrders.tracking')}</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <TrackingMap tracking={tracking.data} />
            {tracking.data.checkpoints.length > 0 && (
              <ol className='grid gap-1 text-sm'>
                {tracking.data.checkpoints.map((c, i) => (
                  <li key={i} className='flex justify-between gap-4'>
                    <span>{localized(c.name)}</span>
                    <span className='text-muted-foreground'>
                      {formatDateTime(c.at)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      <div className='grid gap-4 lg:grid-cols-2'>
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
              <dt className='text-muted-foreground'>
                {a.total_uzs !== null
                  ? t('orders.charged', { rate: formatNumber(a.rate_uzs ?? 0) })
                  : t('clientOrders.inUzs')}
              </dt>
              <dd>
                {a.total_uzs !== null
                  ? formatUzs(a.total_uzs)
                  : uzs(a.total_usd)}
              </dd>
            </dl>
            {a.is_preliminary && (
              <p className='mt-3 text-xs text-muted-foreground'>
                {t('checkout.preliminaryHint')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {order.type === 'catalog' ? t('orders.items') : t('orders.cargo')}
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-2 text-sm'>
            {order.type === 'catalog'
              ? order.items.map((i) => (
                  <div
                    key={i.product_id}
                    className='flex justify-between gap-4'
                  >
                    <span>
                      {localized(i.name)} × {i.quantity}
                    </span>
                    <span>{formatUsd(i.price * i.quantity)}</span>
                  </div>
                ))
              : order.cargo && (
                  <>
                    <div>{order.cargo.description}</div>
                    <div className='font-mono text-muted-foreground'>
                      {order.cargo.tracking_numbers.join(', ')}
                    </div>
                    <div className='text-muted-foreground'>
                      {t('orders.declared')}:{' '}
                      {formatNumber(order.cargo.declared.weight_kg)}{' '}
                      {t('dims.kg')}
                      {order.cargo.chargeable_weight !== null &&
                        ` · ${t('calculator.chargeableWeight')}: ${formatNumber(order.cargo.chargeable_weight)} ${t('dims.kg')}`}
                    </div>
                  </>
                )}
            <div className='text-muted-foreground'>
              {order.origin_warehouse.name} → {order.destination_warehouse.name}{' '}
              · {t(`method.${order.method}`)} ·{' '}
              {t(`receiveMethod.${order.receive_method}`)}
              {order.delivery_address && `: ${order.delivery_address}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {canReview(order) && <ReviewForm order={order} onDone={refresh} />}
      {order.review_id !== null && (
        <p className='text-sm text-muted-foreground'>
          {t('clientOrders.reviewThanks')}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('orders.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className='grid gap-3 text-sm'>
            {order.history
              .slice()
              .reverse()
              .map((h, i) => (
                <li key={i} className='flex flex-wrap justify-between gap-2'>
                  <span className='font-medium'>
                    {t(`orderStatus.${h.status}`)}
                  </span>
                  <span className='text-muted-foreground'>
                    {formatDateTime(h.at)}
                  </span>
                </li>
              ))}
          </ol>
        </CardContent>
      </Card>

      {cancelling && (
        <ConfirmDialog
          open
          onOpenChange={() => setCancelling(false)}
          title={t('orders.cancel')}
          desc={t('clientOrders.cancelConfirm', { number: order.number })}
          confirmText={t('orders.cancel')}
          destructive
          isLoading={cancel.isPending}
          handleConfirm={() => cancel.mutate()}
        />
      )}
    </>
  )
}

function ReviewForm({ order, onDone }: { order: Order; onDone: () => void }) {
  const { t } = useTranslation()
  const [delivery, setDelivery] = useState({ rating: 0, comment: '' })
  const [product, setProduct] = useState({ rating: 0, comment: '' })
  const isCatalog = order.type === 'catalog'
  const send = useMutation({
    mutationFn: () =>
      clientApi.review(order.id, {
        delivery: { ...delivery, rating: delivery.rating as 1 },
        product: isCatalog ? { ...product, rating: product.rating as 1 } : null,
      }),
    onSuccess: () => {
      toast.success(t('clientOrders.reviewThanks'))
      onDone()
    },
  })
  const ready = delivery.rating > 0 && (!isCatalog || product.rating > 0)

  const section = (
    title: string,
    value: typeof delivery,
    set: (v: typeof delivery) => void
  ) => (
    <div className='grid gap-2'>
      <div className='font-medium'>{title}</div>
      <RatingStars
        value={value.rating}
        onChange={(rating) => set({ ...value, rating })}
        size='size-6'
      />
      <Textarea
        rows={2}
        placeholder={t('reviews.commentPlaceholder')}
        value={value.comment}
        onChange={(e) => set({ ...value, comment: e.target.value })}
      />
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('clientOrders.leaveReview')}</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-4 sm:grid-cols-2'>
        {section(t('reviews.delivery'), delivery, setDelivery)}
        {isCatalog && section(t('reviews.product'), product, setProduct)}
        <Button
          className='justify-self-start sm:col-span-2'
          disabled={!ready || send.isPending}
          onClick={() => send.mutate()}
        >
          {t('clientOrders.sendReview')}
        </Button>
      </CardContent>
    </Card>
  )
}
