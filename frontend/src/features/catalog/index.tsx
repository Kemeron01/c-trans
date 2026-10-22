import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import {
  History,
  ImageOff,
  PackageMinus,
  PackagePlus,
  Pencil,
  Plus,
  SlidersHorizontal,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { productsQuery, type StockMovementPayload } from '@/api/catalog'
import { type Product } from '@/api/types'
import { formatNumber, formatUsd } from '@/lib/format'
import { useLocalized } from '@/hooks/use-localized'
import { useWarehouseScope } from '@/hooks/use-warehouse-scope'
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
import { ProductDialog } from './product-dialog'
import { MovementsDialog, StockDialog } from './stock-dialogs'

type DialogState =
  | { type: 'product'; product?: Product }
  | { type: 'stock'; product: Product; kind: StockMovementPayload['kind'] }
  | { type: 'history'; product: Product }
  | null

/** Products of a foreign warehouse. Workers manage stock only. */
export function Catalog() {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { warehouseId, picker, canEdit } = useWarehouseScope('foreign')
  const { data, isLoading } = useQuery({
    ...productsQuery(warehouseId ?? 0),
    enabled: !!warehouseId,
  })
  const [dialog, setDialog] = useState<DialogState>(null)

  const columns: ColumnDef<Product>[] = [
    {
      id: 'name',
      accessorFn: (p) => localized(p.name),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('catalog.name')} />
      ),
      meta: { label: t('catalog.name') },
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          {row.original.photo_url ? (
            <img
              src={row.original.photo_url}
              alt=''
              className='size-10 rounded-md object-cover'
            />
          ) : (
            <div className='flex size-10 items-center justify-center rounded-md bg-muted'>
              <ImageOff className='size-4 text-muted-foreground' />
            </div>
          )}
          <span className='font-medium'>{localized(row.original.name)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('catalog.price')} />
      ),
      meta: { label: t('catalog.price') },
      cell: ({ row }) => formatUsd(row.original.price),
    },
    {
      id: 'size',
      header: t('catalog.size'),
      meta: { label: t('catalog.size') },
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className='text-sm'>
            <div>
              {formatNumber(p.weight_kg)} {t('dims.kg')}
            </div>
            <div className='text-muted-foreground'>
              {p.length_cm}×{p.width_cm}×{p.height_cm} {t('dims.cm')}
            </div>
          </div>
        )
      },
    },
    {
      id: 'stock',
      accessorFn: (p) => p.stock.quantity - p.stock.reserved,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('catalog.available')} />
      ),
      meta: { label: t('catalog.available') },
      cell: ({ row }) => {
        const { quantity, reserved } = row.original.stock
        return (
          <div className='text-sm'>
            <div className='font-medium'>{quantity - reserved}</div>
            <div className='text-xs text-muted-foreground'>
              {t('catalog.stockDetails', { quantity, reserved })}
            </div>
          </div>
        )
      },
    },
    {
      id: 'is_active',
      accessorFn: (p) => String(p.is_active),
      header: t('common.status'),
      meta: { label: t('common.status') },
      filterFn: inSelected,
      cell: ({ row }) => <ActiveBadge active={row.original.is_active} />,
    },
    {
      id: 'actions',
      meta: { className: 'w-12' },
      cell: ({ row }) => {
        const product = row.original
        const stock = (kind: StockMovementPayload['kind']) => () =>
          setDialog({ type: 'stock', product, kind })
        return (
          <RowActions
            actions={[
              {
                label: t('common.edit'),
                icon: Pencil,
                hidden: !canEdit,
                onSelect: () => setDialog({ type: 'product', product }),
              },
              {
                label: t('catalog.movement.receipt'),
                icon: PackagePlus,
                onSelect: stock('receipt'),
              },
              {
                label: t('catalog.movement.write_off'),
                icon: PackageMinus,
                onSelect: stock('write_off'),
              },
              {
                label: t('catalog.movement.adjustment'),
                icon: SlidersHorizontal,
                onSelect: stock('adjustment'),
              },
              {
                label: t('catalog.history'),
                icon: History,
                onSelect: () => setDialog({ type: 'history', product }),
              },
            ]}
          />
        )
      },
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.catalog')}
          description={t('catalog.description')}
        >
          {picker}
          {canEdit && warehouseId && (
            <Button onClick={() => setDialog({ type: 'product' })}>
              <Plus /> {t('catalog.add')}
            </Button>
          )}
        </PageHeading>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('catalog.search')}
          filters={[
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

      {dialog?.type === 'product' && warehouseId && (
        <ProductDialog
          product={dialog.product}
          warehouseId={warehouseId}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'stock' && (
        <StockDialog
          product={dialog.product}
          kind={dialog.kind}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'history' && (
        <MovementsDialog
          product={dialog.product}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
