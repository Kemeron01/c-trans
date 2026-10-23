import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { clientsQuery } from '@/api/analytics'
import { type ClientSummary } from '@/api/types'
import { formatDateTime, formatUsd } from '@/lib/format'
import { DataTable, DataTableColumnHeader } from '@/components/data-table'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'

/** Clients who have orders at the admin's warehouse (all for super-admin). */
export function Clients() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(clientsQuery())

  const columns: ColumnDef<ClientSummary>[] = [
    {
      id: 'client',
      accessorFn: (c) =>
        `${c.full_name} ${c.client_code} ${c.phone} ${c.email ?? ''}`,
      header: t('orders.client'),
      cell: ({ row }) => (
        <div>
          <div className='font-medium'>{row.original.full_name || '—'}</div>
          <div className='font-mono text-xs text-muted-foreground'>
            {row.original.client_code}
          </div>
        </div>
      ),
    },
    {
      id: 'contacts',
      header: t('staff.contacts'),
      cell: ({ row }) => (
        <div className='text-sm'>
          <div>{row.original.phone}</div>
          <div className='text-muted-foreground'>{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'orders_count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('clients.orders')} />
      ),
      cell: ({ row }) => (
        <span className='tabular-nums'>
          {row.original.orders_count}
          {row.original.active_orders > 0 && (
            <span className='text-muted-foreground'>
              {' '}
              · {t('clients.active', { count: row.original.active_orders })}
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'total_usd',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('clients.total')} />
      ),
      cell: ({ row }) => formatUsd(row.original.total_usd),
    },
    {
      accessorKey: 'last_order_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('clients.lastOrder')} />
      ),
      cell: ({ row }) => formatDateTime(row.original.last_order_at),
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.clients')}
          description={t('clients.description')}
        />
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('clients.search')}
        />
      </Main>
    </>
  )
}
