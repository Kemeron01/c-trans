import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Package, Send, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { clientOrdersQuery } from '@/api/account'
import { formatDateTime, formatUsd } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { OrderProgress } from '@/components/order-progress'
import { OrderStatusBadge } from '../orders/order-status-badge'

export function ClientOrders() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(clientOrdersQuery())

  return (
    <div className='grid gap-6'>
      <h1 className='text-2xl font-bold tracking-tight'>
        {t('site.nav.orders')}
      </h1>
      {isLoading ? (
        <Skeleton className='h-40' />
      ) : data?.length ? (
        <div className='grid gap-3'>
          {data.map((o) => (
            <Link
              key={o.id}
              to='/orders/$orderId'
              params={{ orderId: String(o.id) }}
              className='block'
            >
              <Card className='gap-3 py-4 transition-colors hover:bg-accent/40'>
                <CardContent className='grid gap-3 px-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='font-semibold'>{o.number}</span>
                    <OrderStatusBadge status={o.status} />
                    <span className='text-sm text-muted-foreground'>
                      {t(`orderType.${o.type}`)} ·{' '}
                      {formatDateTime(o.created_at)}
                    </span>
                    <span className='ms-auto font-medium'>
                      {formatUsd(o.amounts.total_usd)}
                      {o.amounts.is_preliminary && (
                        <Badge variant='outline' className='ms-2'>
                          {t('orders.preliminary')}
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {o.origin_warehouse.name} → {o.destination_warehouse.name} ·{' '}
                    {t(`method.${o.method}`)}
                  </div>
                  <OrderProgress order={o} compact />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={t('clientOrders.empty')}
          description={t('clientOrders.emptyHint')}
        >
          <div className='mt-2 flex flex-wrap justify-center gap-2'>
            <Button asChild>
              <Link to='/send'>
                <Send /> {t('site.nav.send')}
              </Link>
            </Button>
            <Button asChild variant='outline'>
              <Link to='/catalog'>
                <ShoppingBag /> {t('site.nav.catalog')}
              </Link>
            </Button>
          </div>
        </EmptyState>
      )}
    </div>
  )
}
