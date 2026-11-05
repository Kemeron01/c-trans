import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Highlight,
  HighlightItem,
} from '@animate-ui/react/primitives/effects/highlight'
import { Package, Send, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { clientOrdersQuery } from '@/api/account'
import { formatDateTime, formatUsd } from '@/lib/format'
import { isActive } from '@/lib/order-flow'
import { useSearchParam } from '@/hooks/use-search-param'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { OrderProgress } from '@/components/order-progress'
import { PageLink } from '@/components/page-link'
import { OrderStatusBadge } from '../orders/order-status-badge'

const FILTERS = ['all', 'active', 'done'] as const
type Filter = (typeof FILTERS)[number]
const PAGE_SIZE = 5

export function ClientOrders() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(clientOrdersQuery())
  const [filterRaw, setFilter] = useSearchParam<string>('filter', 'all')
  const [pageRaw, setPage] = useSearchParam<number>('page', 1)
  const filter: Filter = FILTERS.includes(filterRaw as Filter)
    ? (filterRaw as Filter)
    : 'all'
  const filtered = (data ?? []).filter(
    (o) => filter === 'all' || (filter === 'active') === isActive(o.status)
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, pageRaw), pages)
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className='grid gap-6'>
      <h1 className='text-2xl font-bold tracking-tight'>
        {t('site.nav.orders')}
      </h1>
      {!!data?.length && (
        <Highlight
          controlledItems
          value={filter}
          onValueChange={(v) => {
            if (v) {
              setFilter(v)
              setPage(1)
            }
          }}
          click
          className='rounded-full bg-accent'
        >
          <div
            role='group'
            aria-label={t('ordersFilter.label')}
            className='flex w-fit gap-1 rounded-full border p-1'
          >
            {FILTERS.map((f) => (
              <HighlightItem key={f} value={f}>
                <button
                  type='button'
                  aria-pressed={filter === f}
                  className='rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors data-[active=true]:text-foreground'
                >
                  {t(`ordersFilter.${f}`)}
                </button>
              </HighlightItem>
            ))}
          </div>
        </Highlight>
      )}
      {isLoading ? (
        <Skeleton className='h-40' />
      ) : data?.length && !filtered.length ? (
        <p className='text-sm text-muted-foreground'>
          {t('ordersFilter.emptyFiltered')}
        </p>
      ) : data?.length ? (
        <div className='grid gap-3'>
          {visible.map((o) => (
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
          {pages > 1 && (
            <Pagination>
              <PaginationContent>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <PaginationItem key={n}>
                    <PageLink
                      label={t('dataTable.goToPage', { page: n })}
                      isActive={n === page}
                      onSelect={() => setPage(n)}
                    >
                      {n}
                    </PageLink>
                  </PaginationItem>
                ))}
              </PaginationContent>
            </Pagination>
          )}
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
