import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { countriesQuery, warehousesQuery } from '@/api/reference'
import { type Warehouse } from '@/api/types'
import { useLocalized } from '@/hooks/use-localized'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActiveBadge } from '@/components/active-badge'
import {
  DataTable,
  DataTableColumnHeader,
  RowActions,
  inSelected,
} from '@/components/data-table'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { WarehouseDialog } from './warehouse-dialog'

type DialogState = { warehouse?: Warehouse } | null

export function Warehouses() {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { data, isLoading } = useQuery(warehousesQuery())
  const countries = useQuery(countriesQuery()).data ?? []
  const [dialog, setDialog] = useState<DialogState>(null)

  const countryName = (id: number) =>
    localized(countries.find((c) => c.id === id)?.name)

  const columns: ColumnDef<Warehouse>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('warehouses.name')} />
      ),
      meta: { label: t('warehouses.name') },
      cell: ({ row }) => (
        <span className='font-medium'>{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'kind',
      header: t('warehouses.kind'),
      meta: { label: t('warehouses.kind') },
      filterFn: inSelected,
      cell: ({ row }) => (
        <Badge variant={row.original.kind === 'local' ? 'default' : 'outline'}>
          {t(`warehouseKind.${row.original.kind}`)}
        </Badge>
      ),
    },
    {
      id: 'country',
      accessorFn: (w) => String(w.country_id),
      header: t('warehouses.country'),
      meta: { label: t('warehouses.country') },
      filterFn: inSelected,
      cell: ({ row }) => countryName(row.original.country_id),
    },
    {
      id: 'location',
      accessorFn: (w) => `${w.city}, ${w.address}`,
      header: t('warehouses.address'),
      meta: { label: t('warehouses.address') },
      cell: ({ row }) => (
        <div className='text-sm'>
          <div>{row.original.city}</div>
          <div className='text-muted-foreground'>{row.original.address}</div>
        </div>
      ),
    },
    {
      id: 'is_active',
      accessorFn: (w) => String(w.is_active),
      header: t('common.status'),
      meta: { label: t('common.status') },
      filterFn: inSelected,
      cell: ({ row }) => <ActiveBadge active={row.original.is_active} />,
    },
    {
      id: 'actions',
      meta: { className: 'w-12' },
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: t('common.edit'),
              icon: Pencil,
              onSelect: () => setDialog({ warehouse: row.original }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.warehouses')}
          description={t('warehouses.description')}
        >
          <Button onClick={() => setDialog({})}>
            <Plus /> {t('warehouses.add')}
          </Button>
        </PageHeading>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('warehouses.search')}
          filters={[
            {
              columnId: 'kind',
              title: t('warehouses.kind'),
              options: [
                { value: 'foreign', label: t('warehouseKind.foreign') },
                { value: 'local', label: t('warehouseKind.local') },
              ],
            },
            {
              columnId: 'country',
              title: t('warehouses.country'),
              options: countries.map((c) => ({
                value: String(c.id),
                label: localized(c.name),
              })),
            },
            {
              columnId: 'is_active',
              title: t('common.status'),
              options: [
                { value: 'true', label: t('common.active') },
                { value: 'false', label: t('common.inactive') },
              ],
            },
          ]}
        />
      </Main>
      {dialog && (
        <WarehouseDialog
          warehouse={dialog.warehouse}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
