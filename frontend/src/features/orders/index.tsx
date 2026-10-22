import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { ordersQuery } from '@/api/orders'
import { type Order } from '@/api/types'
import { formatDateTime, formatUsd } from '@/lib/format'
import { ORDER_STATUSES } from '@/lib/order-flow'
import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  DataTableColumnHeader,
  inSelected,
} from '@/components/data-table'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { OrderStatusBadge } from './order-status-badge'

export function Orders() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(ordersQuery())

  const columns: ColumnDef<Order>[] = [
    {
      id: 'number',
      // Search also finds tracking numbers, client code and phone (2.2)
      accessorFn: (o) =>
        [
          o.number,
          o.client.client_code,
          o.client.full_name,
          o.client.phone,
          ...(o.cargo?.tracking_numbers ?? []),
        ].join(' '),
      header: t('orders.number'),
      meta: { label: t('orders.number') },
      cell: ({ row }) => (
        <div>
          <Link
            to='/admin/orders/$orderId'
            params={{ orderId: String(row.original.id) }}
            className='font-medium underline-offset-4 hover:underline'
          >
            {row.original.number}
          </Link>
          <div className='text-xs text-muted-foreground'>
            {t(`orderType.${row.original.type}`)}
          </div>
        </div>
      ),
    },
    {
      id: 'client',
      accessorFn: (o) => o.client.full_name,
      header: t('orders.client'),
      meta: { label: t('orders.client') },
      cell: ({ row }) => (
        <div className='text-sm'>
          <div>{row.original.client.full_name}</div>
          <div className='font-mono text-xs text-muted-foreground'>
            {row.original.client.client_code}
          </div>
        </div>
      ),
    },
    {
      id: 'route',
      accessorFn: (o) => o.method,
      header: t('orders.route'),
      meta: { label: t('orders.route') },
      filterFn: inSelected,
      cell: ({ row }) => {
        const o = row.original
        return (
          <div className='text-sm'>
            <div>
              {o.origin_warehouse.name} → {o.destination_warehouse.name}
            </div>
            <div className='text-xs text-muted-foreground'>
              {t(`method.${o.method}`)} ·{' '}
              {t(`receiveMethod.${o.receive_method}`)}
            </div>
          </div>
        )
      },
    },
    {
      id: 'type',
      accessorFn: (o) => o.type,
      filterFn: inSelected,
      enableHiding: false,
      header: () => null,
      cell: () => null,
      meta: { className: 'hidden' },
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      meta: { label: t('common.status') },
      filterFn: inSelected,
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },
    {
      id: 'total',
      accessorFn: (o) => o.amounts.total_usd,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('orders.total')} />
      ),
      meta: { label: t('orders.total') },
      cell: ({ row }) => (
        <div className='text-sm whitespace-nowrap'>
          {formatUsd(row.original.amounts.total_usd)}
          {row.original.amounts.is_preliminary && (
            <Badge variant='outline' className='ms-2'>
              {t('orders.preliminary')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('orders.createdAt')} />
      ),
      meta: { label: t('orders.createdAt') },
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.orders')}
          description={t('orders.description')}
        />
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('orders.search')}
          filters={[
            {
              columnId: 'status',
              title: t('common.status'),
              options: ORDER_STATUSES.map((s) => ({
                value: s,
                label: t(`orderStatus.${s}`),
              })),
            },
            {
              columnId: 'type',
              title: t('orders.type'),
              options: (['catalog', 'delivery'] as const).map((v) => ({
                value: v,
                label: t(`orderType.${v}`),
              })),
            },
            {
              columnId: 'route',
              title: t('orders.method'),
              options: (['auto', 'avia'] as const).map((v) => ({
                value: v,
                label: t(`method.${v}`),
              })),
            },
          ]}
        />
      </Main>
    </>
  )
}
