import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ImageOff, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { publicProductsQuery, publicWarehousesQuery } from '@/api/account'
import { type Product } from '@/api/types'
import { useCartStore } from '@/stores/cart-store'
import { formatUsd } from '@/lib/format'
import { useLocalized } from '@/hooks/use-localized'
import { useUzs } from '@/hooks/use-uzs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'

/** Products of foreign warehouses (scenario 2). Browsing needs no sign-in. */
export function ClientCatalog() {
  const { t } = useTranslation()
  const localized = useLocalized()
  const foreign = (useQuery(publicWarehousesQuery()).data ?? []).filter(
    (w) => w.kind === 'foreign'
  )
  const cartWarehouse = useCartStore((s) => s.warehouseId)
  const [picked, setPicked] = useState<number | null>(null)
  const warehouseId = picked ?? cartWarehouse ?? foreign[0]?.id ?? null
  const { data, isLoading } = useQuery({
    ...publicProductsQuery(warehouseId ?? 0),
    enabled: !!warehouseId,
  })
  const [conflict, setConflict] = useState<Product | null>(null)
  const replaceWith = useCartStore((s) => s.replaceWith)
  const count = useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0))

  return (
    <div className='grid gap-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('site.nav.catalog')}
          </h1>
          <p className='text-muted-foreground'>
            {t('clientCatalog.description')}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Tabs
            value={warehouseId ? String(warehouseId) : ''}
            onValueChange={(v) => setPicked(Number(v))}
          >
            <TabsList>
              {foreign.map((w) => (
                <TabsTrigger key={w.id} value={String(w.id)}>
                  {localized(w.country)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {count > 0 && (
            <Button asChild>
              <Link to='/cart'>
                <ShoppingCart /> {t('clientCatalog.toCart', { count })}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className='h-72' />
          ))}
        </div>
      ) : data?.length ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {data.map((p) => (
            <ProductCard key={p.id} product={p} onConflict={setConflict} />
          ))}
        </div>
      ) : (
        <EmptyState title={t('clientCatalog.empty')} />
      )}

      {conflict && (
        <ConfirmDialog
          open
          onOpenChange={() => setConflict(null)}
          title={t('clientCatalog.otherWarehouse')}
          desc={t('clientCatalog.otherWarehouseHint')}
          confirmText={t('clientCatalog.replaceCart')}
          handleConfirm={() => {
            replaceWith(conflict.warehouse_id, conflict.id)
            setConflict(null)
          }}
        />
      )}
    </div>
  )
}

function ProductCard({
  product: p,
  onConflict,
}: {
  product: Product
  onConflict: (p: Product) => void
}) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { uzs } = useUzs()
  const line = useCartStore((s) =>
    s.lines.find(
      (l) => l.product_id === p.id && s.warehouseId === p.warehouse_id
    )
  )
  const add = useCartStore((s) => s.add)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const available = p.stock.quantity - p.stock.reserved

  return (
    <Card className='gap-0 overflow-hidden py-0'>
      {p.photo_url ? (
        <img
          src={p.photo_url}
          alt=''
          className='aspect-[4/3] w-full object-cover'
        />
      ) : (
        <div className='flex aspect-[4/3] items-center justify-center bg-muted'>
          <ImageOff className='size-8 text-muted-foreground' />
        </div>
      )}
      <CardContent className='grid gap-1 p-4'>
        <div className='font-medium'>{localized(p.name)}</div>
        {localized(p.description) && (
          <p className='line-clamp-2 text-sm text-muted-foreground'>
            {localized(p.description)}
          </p>
        )}
        <div className='text-lg font-semibold'>{formatUsd(p.price)}</div>
        <div className='text-xs text-muted-foreground'>
          {uzs(p.price)} ·{' '}
          {available > 0
            ? t('clientCatalog.available', { count: available })
            : t('clientCatalog.outOfStock')}
        </div>
      </CardContent>
      <CardFooter className='mt-auto p-4 pt-0'>
        {line ? (
          <div className='flex w-full items-center justify-between rounded-md border'>
            <Button
              variant='ghost'
              size='icon'
              aria-label='−'
              onClick={() => setQuantity(p.id, line.quantity - 1)}
            >
              <Minus />
            </Button>
            <span className='tabular-nums'>{line.quantity}</span>
            <Button
              variant='ghost'
              size='icon'
              aria-label='+'
              disabled={line.quantity >= available}
              onClick={() => setQuantity(p.id, line.quantity + 1)}
            >
              <Plus />
            </Button>
          </div>
        ) : (
          <Button
            className='w-full'
            disabled={available <= 0}
            onClick={() => {
              if (!add(p.warehouse_id, p.id)) onConflict(p)
            }}
          >
            <ShoppingCart /> {t('clientCatalog.addToCart')}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
